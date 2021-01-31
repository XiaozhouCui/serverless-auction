// Validation: PATCH request need a body and body need an amount of type number
const schema = {
  properties: {
    body: {
      type: "object",
      properties: {
        amount: {
          type: "number",
        },
      },
      required: ["amount"],
    },
  },
  required: ["body"],
};

export default schema;