import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function getLoginRedirect(req) {
  const url = req.nextUrl.clone();
  url.pathname = '/admin/login';
  const res = NextResponse.redirect(url);
  // เคลียร์ cookie ที่อาจไม่ถูกต้องออก
  res.cookies.delete('session');
  return res;
}

export function middleware(req) {
  const url = req.nextUrl.clone();
  const token = req.cookies.get('session')?.value;
  const isProtected = url.pathname.startsWith('/admin');
  const isLoginPage = url.pathname.startsWith('/admin/login');

  // ถ้าไม่ใช่หน้าที่ต้องป้องกัน ให้ไปต่อ
  if (!isProtected) {
    return NextResponse.next();
  }

  // --- กรณีไม่มี Token ---
  if (!token) {
    // ถ้าพยายามเข้าหน้าแอดมิน (ที่ไม่ใช่หน้า login) ให้ redirect ไปหน้า login
    if (!isLoginPage) {
      return getLoginRedirect(req);
    }
    // ถ้าอยู่ที่หน้า login อยู่แล้ว และไม่มี token ก็ให้เข้าได้
    return NextResponse.next();
  }

  // --- กรณีมี Token ---
  try {
    const decoded = verify(token, JWT_SECRET);

    if (isLoginPage) {
      // ถ้าล็อกอินแล้วและพยายามเข้าหน้า login ให้ redirect ออก
      url.pathname = decoded.mustChangePassword ? '/admin/change-password' : '/admin';
      return NextResponse.redirect(url);
    }

    // กรณีเข้าหน้าแอดมินอื่นๆ ที่ไม่ใช่หน้า login
    if (decoded.mustChangePassword && !url.pathname.startsWith('/admin/change-password')) {
      // ถ้าจำเป็นต้องเปลี่ยนรหัสผ่าน แต่ไม่ได้อยู่ที่หน้าเปลี่ยนรหัสผ่าน
      url.pathname = '/admin/change-password';
      return NextResponse.redirect(url);
    }
    
    if (!decoded.mustChangePassword && url.pathname.startsWith('/admin/change-password')) {
        // ถ้าไม่จำเป็นต้องเปลี่ยนรหัสผ่านแล้ว แต่อยู่ที่หน้าเปลี่ยนรหัสผ่าน
        url.pathname = '/admin';
        return NextResponse.redirect(url);
    }
    
    // เงื่อนไขถูกต้องทั้งหมด อนุญาตให้เข้าถึงได้
    return NextResponse.next();

  } catch (err) {
    // หาก Token ไม่ถูกต้อง (เช่น หมดอายุ)
    return getLoginRedirect(req);
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};

