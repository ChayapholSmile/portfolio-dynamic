import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export function middleware(req) {
  const url = req.nextUrl.clone();
  const token = req.cookies.get('session')?.value;
  const isLoginPage = url.pathname.startsWith('/admin/login');

  // กรณีผู้ใช้พยายามเข้าหน้าล็อกอิน
  if (isLoginPage) {
    if (token) {
      try {
        const decoded = verify(token, JWT_SECRET);
        // ถ้ามี token ที่ถูกต้อง ให้ redirect ออกจากหน้าล็อกอิน
        url.pathname = decoded?.mustChangePassword ? '/admin/change-password' : '/admin';
        return NextResponse.redirect(url);
      } catch (e) {
        // ถ้า token ไม่ถูกต้อง ให้ลบ cookie ที่เสียออก แล้วให้เข้าหน้าล็อกอินใหม่
        const response = NextResponse.next();
        response.cookies.delete('session');
        return response;
      }
    }
    // ถ้าไม่มี token ให้เข้าหน้าล็อกอินได้เลย
    return NextResponse.next();
  }
  
  // กรณีผู้ใช้พยายามเข้าหน้าแอดมินอื่นๆ ที่ไม่ใช่หน้าล็อกอิน
  if (url.pathname.startsWith('/admin')) {
    if (!token) {
      // ถ้าไม่มี token ให้ redirect ไปหน้าล็อกอิน
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }

    try {
      const decoded = verify(token, JWT_SECRET);
      // ตรวจสอบว่าจำเป็นต้องเปลี่ยนรหัสผ่านหรือไม่
      if (decoded?.mustChangePassword && !url.pathname.startsWith('/admin/change-password')) {
        url.pathname = '/admin/change-password';
        return NextResponse.redirect(url);
      }
       // ถ้าผู้ใช้อยู่ในหน้าเปลี่ยนรหัสผ่าน แต่ไม่จำเป็นต้องเปลี่ยนแล้ว ให้ redirect ไปหน้าหลักของแอดมิน
       if (!decoded?.mustChangePassword && url.pathname.startsWith('/admin/change-password')) {
        url.pathname = '/admin';
        return NextResponse.redirect(url);
      }
    } catch (e) {
      // ถ้า token ไม่ถูกต้อง ให้ redirect ไปหน้าล็อกอินและลบ cookie ที่เสียออก
      url.pathname = '/admin/login';
      const response = NextResponse.redirect(url);
      response.cookies.delete('session');
      return response;
    }
  }

  // ถ้าไม่ใช่ route ของ admin ให้ไปต่อ
  return NextResponse.next();
}

export const config = {
  // matcher ยังคงเดิม แต่ตรรกะภายในไฟล์จะจัดการเรื่อง redirect loop เอง
  matcher: ['/admin/:path*'],
};
