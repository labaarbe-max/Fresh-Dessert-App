export const NextResponse = {
  json: (body: unknown, init?: { status?: number }) => ({
    body,
    init,
  }),
};