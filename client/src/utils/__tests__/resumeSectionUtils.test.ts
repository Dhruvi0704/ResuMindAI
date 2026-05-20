import { expect, test, describe } from 'vitest';
import { detectJobCategory, getDynamicSectionOrder } from '../resumeSectionUtils';

describe('detectJobCategory', () => {
    test('identifies Tech roles correctly', () => {
        expect(detectJobCategory('Software Engineer')).toBe('Tech');
        expect(detectJobCategory('Web Developer')).toBe('Tech');
        expect(detectJobCategory('Data Scientist')).toBe('Tech');
        expect(detectJobCategory('AI Engineer')).toBe('Tech');
        expect(detectJobCategory('DevOps Engineer')).toBe('Tech');
        expect(detectJobCategory('Backend Programmer')).toBe('Tech');
    });

    test('identifies Commerce / Business roles correctly', () => {
        expect(detectJobCategory('Accountant')).toBe('Commerce');
        expect(detectJobCategory('Financial Analyst')).toBe('Commerce');
        expect(detectJobCategory('Business Analyst')).toBe('Commerce');
        expect(detectJobCategory('Marketing Manager')).toBe('Commerce');
        expect(detectJobCategory('HR Executive')).toBe('Commerce');
        expect(detectJobCategory('Sales Executive')).toBe('Commerce');
        expect(detectJobCategory('Operations Executive')).toBe('Commerce');
    });

    test('identifies Creative / Arts roles correctly', () => {
        expect(detectJobCategory('Graphic Designer')).toBe('Creative');
        expect(detectJobCategory('UI/UX Designer')).toBe('Creative');
        expect(detectJobCategory('Content Writer')).toBe('Creative');
        expect(detectJobCategory('Video Editor')).toBe('Creative');
        expect(detectJobCategory('Animator')).toBe('Creative');
        expect(detectJobCategory('Creative Director')).toBe('Creative');
    });

    test('defaults to General roles correctly', () => {
        expect(detectJobCategory('Administrative Assistant')).toBe('General');
        expect(detectJobCategory('Customer Support')).toBe('General');
        expect(detectJobCategory('Teacher')).toBe('General');
        expect(detectJobCategory('')).toBe('General');
    });
});

describe('getDynamicSectionOrder', () => {
    test('returns correct order for Tech roles', () => {
        const order = getDynamicSectionOrder('Software Engineer');
        // Tech: Header, Summary, Tech Skills, Projects, Experience, Education, Certifications, Links
        expect(order).toEqual(['personal', 'skills', 'projects', 'experience', 'education', 'certifications', 'links']);
    });

    test('returns correct order for Commerce roles', () => {
        const order = getDynamicSectionOrder('Marketing Manager');
        // Commerce: Header, Summary, Core Skills, Experience, Education, Certifications, Projects, Links
        expect(order).toEqual(['personal', 'skills', 'experience', 'education', 'certifications', 'projects', 'links']);
    });

    test('returns correct order for Creative roles', () => {
        const order = getDynamicSectionOrder('Graphic Designer');
        // Creative: Header, Summary, Creative Skills, Links(Portfolio), Projects, Experience, Education, Certifications
        expect(order).toEqual(['personal', 'skills', 'links', 'projects', 'experience', 'education', 'certifications']);
    });

    test('returns correct order for General roles and undefined/empty string', () => {
        const orderGeneral = getDynamicSectionOrder('Customer Support');
        const orderEmpty = getDynamicSectionOrder('');
        const orderUndefined = getDynamicSectionOrder(undefined);
        
        const expected = ['personal', 'skills', 'experience', 'education', 'certifications', 'projects', 'links'];
        
        expect(orderGeneral).toEqual(expected);
        expect(orderEmpty).toEqual(expected);
        expect(orderUndefined).toEqual(expected);
    });
});
