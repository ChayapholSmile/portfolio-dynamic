import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export function middleware(req) {
  const url = req.nextUrl;
  const loginUrl = new URL('/admin/login', req.url);
  const changePasswordUrl = new URL('/admin/change-password', req.url);
  const adminHomeUrl = new URL('/admin', req.url);

  const token = req.cookies.get('session')?.value;
  const onLoginPage = url.pathname.startsWith('/admin/login');

  // กรณีไม่มี Token
  if (!token) {
    if (onLoginPage) {
      // ถ้าอยู่ที่หน้า login อยู่แล้ว ก็อนุญาตให้เข้า
      return NextResponse.next();
    }
    // ถ้าพยายามเข้าหน้าอื่น ให้ส่งไปหน้า login
    return NextResponse.redirect(loginUrl);
  }

  // กรณีมี Token ให้ตรวจสอบความถูกต้อง
  try {
    const decoded = verify(token, JWT_SECRET);
    const onChangePasswordPage = url.pathname.startsWith('/admin/change-password');

    // ตรรกะสำหรับผู้ใช้ที่ "ต้อง" เปลี่ยนรหัสผ่าน
    if (decoded.mustChangePassword) {
      if (onChangePasswordPage) {
        // อยู่ถูกหน้าแล้ว (หน้าเปลี่ยนรหัสผ่าน) อนุญาตให้เข้า
        return NextResponse.next();
      }
      // อยู่ผิดหน้า บังคับให้ไปหน้าเปลี่ยนรหัสผ่าน
      return NextResponse.redirect(changePasswordUrl);
    } 
    
    // ตรรกะสำหรับผู้ใช้ที่ "ไม่ต้อง" เปลี่ยนรหัสผ่าน
    else {
      if (onLoginPage || onChangePasswordPage) {
        // ไม่ควรอยู่ที่หน้า login หรือหน้าเปลี่ยนรหัสผ่าน ให้ส่งไปหน้า admin หลัก
        return NextResponse.redirect(adminHomeUrl);
      }
      // อยู่ในหน้า admin อื่นๆ ที่ถูกต้องแล้ว อนุญาตให้เข้า
      return NextResponse.next();
    }
  } catch (error) {
    // หาก Token ไม่ถูกต้อง (เช่น หมดอายุ, ผิดรูปแบบ)
    // ให้ส่งไปหน้า login พร้อมกับล้าง cookie ที่ไม่ถูกต้องทิ้ง
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set('session', '', { maxAge: -1 });
    return response;
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};

