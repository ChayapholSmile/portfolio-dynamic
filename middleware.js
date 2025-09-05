import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const LOGIN_URL = '/admin/login';
const CHANGE_PASSWORD_URL = '/admin/change-password';
const ADMIN_HOME_URL = '/admin';

// ฟังก์ชันสำหรับสร้าง redirect ไปยังหน้า login พร้อมล้าง cookie ที่ไม่ถูกต้อง
function getLoginRedirect(request) {
  const redirectUrl = new URL(LOGIN_URL, request.url);
  const response = NextResponse.redirect(redirectUrl);
  // ตั้งค่าให้ cookie หมดอายุทันที เป็นวิธีที่แน่นอนกว่าในการลบ
  response.cookies.set('session', '', { maxAge: -1 });
  return response;
}

export async function middleware(req) {
  const url = req.nextUrl;
  const token = req.cookies.get('session')?.value;

  // --- กรณีไม่มี Token ---
  if (!token) {
    // ถ้าพยายามเข้าหน้า login อยู่แล้ว ก็อนุญาต
    if (url.pathname === LOGIN_URL) {
      return NextResponse.next();
    }
    // ถ้าพยายามเข้าหน้า admin อื่นๆ ให้ส่งไปหน้า login
    return getLoginRedirect(req);
  }

  // --- กรณีมี Token ---
  // พยายามถอดรหัส Token
  let decodedToken;
  try {
    decodedToken = verify(token, JWT_SECRET);
  } catch (error) {
    // ถ้า Token ไม่ถูกต้อง (เช่น หมดอายุ) ให้ส่งไปหน้า login
    return getLoginRedirect(req);
  }

  const { mustChangePassword } = decodedToken;
  const isLoginPage = url.pathname === LOGIN_URL;
  const isChangePasswordPage = url.pathname === CHANGE_PASSWORD_URL;

  // ตรรกะสำหรับผู้ใช้ที่ "ต้อง" เปลี่ยนรหัสผ่าน
  if (mustChangePassword) {
    // ถ้ากำลังเข้าหน้าเปลี่ยนรหัสผ่านพอดี ก็อนุญาต
    if (isChangePasswordPage) {
      return NextResponse.next();
    }
    // ถ้าไปหน้าอื่น ให้บังคับกลับมาที่หน้าเปลี่ยนรหัสผ่าน
    return NextResponse.redirect(new URL(CHANGE_PASSWORD_URL, req.url));
  }
  
  // ตรรกะสำหรับผู้ใช้ที่ "ไม่ต้อง" เปลี่ยนรหัสผ่าน
  if (!mustChangePassword) {
    // ถ้าเผลอไปเข้าหน้า login หรือหน้าเปลี่ยนรหัสผ่าน ให้ส่งไปหน้า admin หลัก
    if (isLoginPage || isChangePasswordPage) {
      return NextResponse.redirect(new URL(ADMIN_HOME_URL, req.url));
    }
  }

  // หากเงื่อนไขทั้งหมดผ่าน แสดงว่าเป็นผู้ใช้ที่เข้าระบบถูกต้องและอยู่ถูกที่แล้ว
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

