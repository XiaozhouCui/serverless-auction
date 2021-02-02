// Validation: uploaded picture is base64 string
const schema = {
  properties: {
    body: {
      type: "string",
      minLength: 1,
      pattern: "=$", // base64 ends with "="
    },
  },
  required: ["body"],
};

export default schema;
