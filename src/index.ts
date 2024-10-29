type ValidationRule<T> = {
    validate: (value: T, formData: any) => Promise<boolean> | boolean;
    message: string | ((value: T) => string)
};

class FormValidator<T extends Record<string, any >> {
    private fields: Map<keyof T, ValidationRule<T[keyof T]>[]> = new Map();
    private dependentFields: Array<{
        field: keyof T;
        dependencies: (keyof T)[];
        validator: (value: T[keyof T], deps: Pick<T, keyof T>) => Promise<boolean> | boolean;
    }> = [];
    field <K extends keyof T> (
        field: K,
        rules: ValidationRule<T[keyof T]>[]
    ): FormValidator<T>{
        this.fields.set(field,rules);
        return this
    };
    dependentField<K extends keyof T, D extends keyof T> (
        field: K,
        dependencies: D[],
        validator: (value: T[keyof T], deps: Pick<T, D>) =>
            Promise<boolean> | boolean
    ): FormValidator<T>{
        this.dependentFields.push({field,dependencies,validator});
        return this;
    };
    async validate(data: T) :  Promise<Record<keyof T, string[]>>{
        const errors: Record<keyof T, string[]> = {} as Record<keyof T, string[]>;
        for (const [field,rules] of this.fields.entries()) {
            const fieldErrors: string[] = [];
            for (const rule of rules) {
                try {
                    const isValid = await rule.validate(data[field],data);
                    if(!isValid){
                        const message = typeof rule.message === 'function' ?
                            rule.message(data[field]) : rule.message;
                        fieldErrors.push(message);
                    }
                }
                    catch(error) {
                        console.error('Validation error for field',String(field),':',error);
                        fieldErrors.push('An error occured during validation');
                    }
            }
            if(fieldErrors.length > 0) {
                errors[field] = fieldErrors;
            }
        }
        for (const { field, dependencies, validator} of this.dependentFields) {
            const depsValues = dependencies.reduce((acc,dep)=> {
                acc[dep] = data [dep];
                return acc;
            },{} as Pick<T, keyof T>);
            try {
                const isValid = await validator (data[field],depsValues);
                if(!isValid) {
                    if( !errors[field]) {
                        errors[field] = [];
                    }
                    errors[field].push(String(field),' is invalid');
                }
            } catch(error) {
                console.error('Validation error for dependent field',String(field),':',error);
                if(!errors[field]) {
                    errors[field] = [];
                }
            errors[field].push('An error occured during dependent validation');
            }
        }
        return errors;
    };
}

interface LoginForm {
    email: string;
    password: string;
    confirmPassword: string;
}

const validator = new FormValidator<LoginForm>()
    .field('email',[
        {
            validate: (email) => email.includes('@'),
            message: 'Invalid email format'
        }
    ])
    .field('password',[
        {
            validate:(password) => password.length >= 8,
            message: 'Password must be atleast 8 characters long'
        }
    ])
    .dependentField('confirmPassword',['password'],(confirm, { password}) => confirm === password
    )

const formData: LoginForm = {
    email: 'testexample.com',
    password: 'pass123',
    confirmPassword:'password1234'
}

validator.validate(formData).then((errors)=> {
    console.log(errors);
})