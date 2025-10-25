import { AuthController } from "../../controllers/auth";
import { useValidator } from "../../middlewares/validate";
import { createLoginSchema } from "../../validators/auth.schema";

const controller = new AuthController();

export default [
  {
    path: "/login", // path includes prefix already
    controller: {
      post: controller.login,
    },
    validators: {
      post: useValidator(createLoginSchema),
    },
    docs: {
      post: {
        summary: "Login user",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: createLoginSchema,
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string", example: "eyJhbGciOi..." },
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "string", example: "123" },
                        email: { type: "string", example: "user@example.com" },
                        name: { type: "string", example: "Abhishek Sharma" },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Invalid email or password",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
];
