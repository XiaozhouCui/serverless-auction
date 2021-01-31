// Validation: POST request need a body and body need a title
const schema = {
  properties: {
    body: {
      type: "object",
      properties: {
        title: {
          type: "string",
        },
      },
      required: ["title"],
    },
  },
  required: ["body"],
};

export default schema;