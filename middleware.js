import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Helper function to create a redirect response with anti-caching headers
function createRedirect(url) {
  const response = NextResponse.redirect(url);
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

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
      return NextResponse.next();
    }
    return createRedirect(loginUrl);
  }

  // กรณีมี Token ให้ตรวจสอบความถูกต้อง
  try {
    const decoded = verify(token, JWT_SECRET);
    const onChangePasswordPage = url.pathname.startsWith('/admin/change-password');

    // ตรรกะสำหรับผู้ใช้ที่ "ต้อง" เปลี่ยนรหัสผ่าน
    if (decoded.mustChangePassword) {
      if (onChangePasswordPage) {
        return NextResponse.next();
      }
      return createRedirect(changePasswordUrl);
    } 
    
    // ตรรกะสำหรับผู้ใช้ที่ "ไม่ต้อง" เปลี่ยนรหัสผ่าน
    else {
      if (onLoginPage || onChangePasswordPage) {
        return createRedirect(adminHomeUrl);
      }
      return NextResponse.next();
    }
  } catch (error) {
    // หาก Token ไม่ถูกต้อง ให้ส่งไปหน้า login พร้อมล้าง cookie
    const response = createRedirect(loginUrl);
    response.cookies.set('session', '', { maxAge: -1 });
    return response;
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};

