import { withAuth } from "next-auth/middleware";

export default withAuth(function proxy(req) { }, {
    callbacks: {
        authorized: ({ token }) => !!token,
    },
});

export const config = { matcher: ["/ucp/:path*"] };
