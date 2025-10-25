import { User } from "../../models";

interface GetUsersOptions {
  userName?: string;
  role?: string;
  page?: number;
  limit?: number;
}

interface PaginatedUsers {
  users: User[];
  page: number;
  limit: number;
  totalUsers: number;
  totalPages: number;
}

export class UserService {
    async getUsers(options: GetUsersOptions): Promise<PaginatedUsers> {
        const { userName, role, page = 1, limit = 10 } = options;
        const pageNum = Number(page);
        const limitNum = Number(limit);
      
        // Base query
        let query = User.query()
          .whereNull("users.deletedAt")
          .joinRelated("roles.role") // inner join ensures only users with roles are included
          .whereNot("roles:role.name", "admin") // exclude admin users
          .withGraphFetched("[roles.role , company , trucks.truckType, driver]")
      
        // Filter by username
        if (userName) {
          query = query.where("users.userName", "ilike", `%${userName}%`);
        }
      
        // Filter by specific role if provided
        if (role) {
          query = query.andWhere("roles:role.name", role);
        }
      
        // Get total count before pagination
        const totalUsers = await query.resultSize();
      
        // Pagination and eager load relations
        const users = await query
          .offset((pageNum - 1) * limitNum)
          .limit(limitNum)
          .withGraphFetched("[roles.role, company, driver]"); // fetch roles, company, driver
      
        const totalPages = Math.ceil(totalUsers / limitNum);
      
        return {
          users,
          page: pageNum,
          limit: limitNum,
          totalUsers,
          totalPages,
        };
      }
      
}

export default new UserService();
