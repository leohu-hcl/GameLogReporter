import { NextRequest, NextResponse } from 'next/server';

/**
 * 中间件 - 注意：服务器端中间件无法访问 localStorage
 * 认证检查应该在客户端进行（AuthContext + ProtectedRoute）
 */

export function middleware(request: NextRequest) {
  // 允许所有请求通过，让客户端处理认证
  // 服务器端中间件无法访问 localStorage，所以无法完全验证认证状态
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有请求路径除了:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

