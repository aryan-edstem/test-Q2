"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class FormValidator {
    constructor() {
        this.fields = new Map();
        this.dependentFields = [];
    }
    field(field, rules) {
        this.fields.set(field, rules);
        return this;
    }
    ;
    dependentField(field, dependencies, validator) {
        this.dependentFields.push({ field, dependencies, validator });
        return this;
    }
    ;
    validate(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const errors = {};
            for (const [field, rules] of this.fields.entries()) {
                const fieldErrors = [];
                for (const rule of rules) {
                    try {
                        const isValid = yield rule.validate(data[field], data);
                        if (!isValid) {
                            const message = typeof rule.message === 'function' ?
                                rule.message(data[field]) : rule.message;
                            fieldErrors.push(message);
                        }
                    }
                    catch (error) {
                        console.error('Validation error for field', String(field), ':', error);
                        fieldErrors.push('An error occured during validation');
                    }
                }
                if (fieldErrors.length > 0) {
                    errors[field] = fieldErrors;
                }
            }
            for (const { field, dependencies, validator } of this.dependentFields) {
                const depsValues = dependencies.reduce((acc, dep) => {
                    acc[dep] = data[dep];
                    return acc;
                }, {});
                try {
                    const isValid = yield validator(data[field], depsValues);
                    if (!isValid) {
                        if (!errors[field]) {
                            errors[field] = [];
                        }
                        errors[field].push(String(field), ' is invalid');
                    }
                }
                catch (error) {
                    console.error('Validation error for dependent field', String(field), ':', error);
                    if (!errors[field]) {
                        errors[field] = [];
                    }
                    errors[field].push('An error occured during dependent validation');
                }
            }
            return errors;
        });
    }
    ;
}
const validator = new FormValidator()
    .field('email', [
    {
        validate: (email) => email.includes('@'),
        message: 'Invalid email format'
    }
])
    .field('password', [
    {
        validate: (password) => password.length >= 8,
        message: 'Password must be atleast 8 characters long'
    }
])
    .dependentField('confirmPassword', ['password'], (confirm, { password }) => confirm === password);
const formData = {
    email: 'testexample.com',
    password: 'pass123',
    confirmPassword: 'password1234'
};
validator.validate(formData).then((errors) => {
    console.log(errors);
});
