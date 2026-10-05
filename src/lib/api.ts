import { Prisma } from "@prisma/client"
import { ZodError } from "zod"

import { HttpError } from "./auth"

/** Wraps a route handler so thrown errors become clean JSON responses. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args)
    } catch (e) {
      if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status })
      if (e instanceof ZodError) {
        const first = e.issues[0]
        return Response.json(
          { error: first ? `${first.path.join(".") || "input"}: ${first.message}` : "Invalid input" },
          { status: 400 },
        )
      }
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2025") return Response.json({ error: "Record not found" }, { status: 404 })
        if (e.code === "P2002") return Response.json({ error: "That value already exists" }, { status: 409 })
      }
      console.error(e)
      return Response.json({ error: "Something went wrong" }, { status: 500 })
    }
  }
}

export function badRequest(message: string): never {
  throw new HttpError(400, message)
}
