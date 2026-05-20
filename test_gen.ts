import { detectJobCategory, getDynamicSectionOrder } from './client/src/utils/resumeSectionUtils.ts';
console.log("Admin Asst:", detectJobCategory('Administrative Assistant'));
console.log("Customer Support:", detectJobCategory('Customer Support'));
console.log("Teacher:", detectJobCategory('Teacher'));
console.log("Empty:", detectJobCategory(''));
console.log("Software:", detectJobCategory('Software Engineer'));
console.log("Marketing:", detectJobCategory('Marketing Manager'));
console.log("Graphic:", detectJobCategory('Graphic Designer'));
