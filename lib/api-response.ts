import { NextResponse } from "next/server"

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export class ApiResponseHelper {
  static success<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
      success: true,
      data,
      message,
    })
  }

  static error(message: string, status = 400): NextResponse<ApiResponse> {
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status },
    )
  }

  static unauthorized(message = "Unauthorized"): NextResponse<ApiResponse> {
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 401 },
    )
  }

  static notFound(message = "Resource not found"): NextResponse<ApiResponse> {
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 404 },
    )
  }

  static serverError(message = "Internal server error"): NextResponse<ApiResponse> {
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    )
  }
}
