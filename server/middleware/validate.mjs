import { badRequest } from "../utils/HttpError.mjs";

/**
 * Middleware kiểm tra đầu vào đơn giản, không cần thư viện ngoài.
 *
 * validate({
 *   body:  { email: { required: true, type: "string", pattern: /.../, label: "Email" } },
 *   query: { date:  { type: "string", pattern: DATE_PATTERN } },
 *   params:{ id:    { type: "number" } },
 * })
 *
 * Luật hỗ trợ: required, type (string|number|boolean|array), min, max,
 * minLength, maxLength, enum, pattern, label (tên hiển thị trong thông báo lỗi).
 * Với type "number" ở query/params, chuỗi số sẽ được ép kiểu sang Number.
 */
export function validate(schema) {
  return (req, res, next) => {
    for (const source of ["params", "query", "body"]) {
      const rules = schema[source];
      if (!rules) continue;
      const data = req[source] || {};

      for (const [field, rule] of Object.entries(rules)) {
        const label = rule.label || field;
        let value = data[field];
        const empty = value === undefined || value === null || value === "";

        if (empty) {
          if (rule.required) return next(badRequest(`Vui lòng nhập ${label}.`));
          continue;
        }

        if (rule.type === "number") {
          const num = typeof value === "number" ? value : Number(value);
          if (Number.isNaN(num)) return next(badRequest(`${label} phải là số.`));
          value = num;
          if (source !== "query") data[field] = num;
          if (rule.min !== undefined && num < rule.min) return next(badRequest(`${label} phải ≥ ${rule.min}.`));
          if (rule.max !== undefined && num > rule.max) return next(badRequest(`${label} phải ≤ ${rule.max}.`));
        }

        if (rule.type === "string") {
          if (typeof value !== "string") return next(badRequest(`${label} phải là chuỗi ký tự.`));
          const s = value.trim();
          if (rule.minLength && s.length < rule.minLength) {
            return next(badRequest(`${label} phải có ít nhất ${rule.minLength} ký tự.`));
          }
          if (rule.maxLength && s.length > rule.maxLength) {
            return next(badRequest(`${label} tối đa ${rule.maxLength} ký tự.`));
          }
          if (rule.pattern && !rule.pattern.test(s)) return next(badRequest(`${label} không đúng định dạng.`));
        }

        if (rule.type === "boolean" && typeof value !== "boolean") {
          return next(badRequest(`${label} phải là true/false.`));
        }

        if (rule.type === "array") {
          if (!Array.isArray(value)) return next(badRequest(`${label} phải là danh sách.`));
          if (rule.minLength && value.length < rule.minLength) {
            return next(badRequest(`Vui lòng chọn ít nhất ${rule.minLength} ${label}.`));
          }
        }

        if (rule.enum && !rule.enum.includes(value)) {
          return next(badRequest(`${label} không hợp lệ (cho phép: ${rule.enum.join(", ")}).`));
        }
      }
    }
    next();
  };
}

