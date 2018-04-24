declare module 'graphql-deduplicator' {
  export function deflate(node: object, path: [string]): {
    [key: string]: any
  }
  export function inflate(node: object, path: [string]): {
    [key: string]: any
  }
}
