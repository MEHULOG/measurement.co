export default {
  providers: [
    {
      // Set CLERK_JWT_ISSUER_DOMAIN in Convex dashboard environment variables.
      // It must match the "Issuer" of the "convex" JWT template in Clerk.
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: 'convex',
    },
  ],
}
