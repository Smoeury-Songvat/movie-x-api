export class PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  constructor(data: T[], total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    this.data = data;
    this.meta = {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}

export class ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;

  constructor(data?: T, message = 'Success') {
    this.success = true;
    this.message = message;
    this.data = data;
  }
}