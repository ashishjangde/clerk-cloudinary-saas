import {  clerkMiddleware ,createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const publicRoutes = createRouteMatcher( [
        '/signup',
        '/signin',
        '/',
        '/home'
    ]);
const isPublicApiRoute = createRouteMatcher( [
    '/api/videos'
])

export default clerkMiddleware( async (auth , req)=>{
    const obj= auth();
    const userId = obj.then((user) => user.userId);
    const currentUrl =  new URL(req.url);
    const isHomePage = currentUrl.pathname === '/home';
    const isApiRoute = currentUrl.pathname.startsWith('/api')
    if( await userId && publicRoutes(req) && !isHomePage){
        return NextResponse.redirect(new URL('/home', req.url));
    }
    if(!userId){
        // If user is not logged in and trying to access a protected route
        if(!isPublicApiRoute(req)&& !publicRoutes(req)){
            return NextResponse.redirect(new URL('/signin', req.url));
        }
          // If the request is for a protected API and the user is not logged in
        if(isApiRoute &&  !isPublicApiRoute(req)){
            return NextResponse.redirect(new URL('/signin', req.url));
        }
    }

    return NextResponse.next();

});

export const config = {
matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};