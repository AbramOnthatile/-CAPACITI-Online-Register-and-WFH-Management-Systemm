import { useEffect, useId, useState } from 'react';
import type {
  ChangeEventHandler,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

export type FieldProps = {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function Field({
  id,
  label,
  hint,
  error,
  required = false,
  children,
  footer,
  className = '',
}: FieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-ink-900"
        >
          {label}
          {required && <span aria-hidden="true" className="ml-1 text-danger">*</span>}
        </label>
      )}
      {children}
      {(hint || error || footer) && (
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 text-sm">
          <div className="space-y-1">
            {hint && (
              <p id={hintId} className="text-ink-500">
                {hint}
              </p>
            )}
            {error && (
              <p id={errorId} className="text-danger" role="alert">
                {error}
              </p>
            )}
          </div>
          {footer}
        </div>
      )}
    </div>
  );
}

type FieldControlProps = {
  label?: string;
  hint?: string;
  error?: string;
  className?: string;
  containerClassName?: string;
};

function describedBy(id: string, hint?: string, error?: string) {
  return [hint && `${id}-hint`, error && `${id}-error`]
    .filter(Boolean)
    .join(' ') || undefined;
}

const controlClasses =
  'min-h-11 w-full rounded-control border border-border bg-card px-3 py-2 text-base text-ink-900 placeholder:text-ink-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink-500';

export type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className'
> &
  FieldControlProps;

export function Input({
  id: providedId,
  label,
  hint,
  error,
  required,
  className = '',
  containerClassName = '',
  ...props
}: InputProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  const input = (
    <input
      {...props}
      id={id}
      required={required}
      aria-invalid={Boolean(error) || undefined}
      aria-describedby={describedBy(id, hint, error)}
      className={`${controlClasses} ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''} ${className}`}
    />
  );

  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      {input}
    </Field>
  );
}

export type TextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'className' | 'onChange'
> &
  FieldControlProps & {
    onChange?: ChangeEventHandler<HTMLTextAreaElement>;
    showCharacterCount?: boolean;
  };

export function Textarea({
  id: providedId,
  label,
  hint,
  error,
  required,
  maxLength,
  value,
  defaultValue,
  onChange,
  showCharacterCount = maxLength !== undefined,
  className = '',
  containerClassName = '',
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const [characterCount, setCharacterCount] = useState(
    String(value ?? defaultValue ?? '').length,
  );
  const counterId = `${id}-counter`;

  useEffect(() => {
    if (value !== undefined) {
      setCharacterCount(String(value).length);
    }
  }, [value]);

  const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    setCharacterCount(event.currentTarget.value.length);
    onChange?.(event);
  };
  const describedByIds = [
    describedBy(id, hint, error),
    showCharacterCount && maxLength !== undefined ? counterId : undefined,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  const textarea = (
    <textarea
      {...props}
      id={id}
      value={value}
      defaultValue={defaultValue}
      maxLength={maxLength}
      required={required}
      onChange={handleChange}
      aria-invalid={Boolean(error) || undefined}
      aria-describedby={describedByIds}
      className={`${controlClasses} min-h-28 resize-y ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''} ${className}`}
    />
  );

  const counter =
    showCharacterCount && maxLength !== undefined ? (
      <span
        id={counterId}
        className="shrink-0 text-ink-500"
      >
        {characterCount}/{maxLength}
      </span>
    ) : undefined;

  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      footer={counter}
      className={containerClassName}
    >
      {textarea}
    </Field>
  );
}

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'className' | 'size' | 'children'
> &
  FieldControlProps & {
    options: SelectOption[];
    placeholder?: string;
  };

export function Select({
  id: providedId,
  label,
  hint,
  error,
  required,
  options,
  placeholder,
  className = '',
  containerClassName = '',
  ...props
}: SelectProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const select = (
    <select
      {...props}
      id={id}
      required={required}
      aria-invalid={Boolean(error) || undefined}
      aria-describedby={describedBy(id, hint, error)}
      className={`${controlClasses} ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''} ${className}`}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  );

  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      {select}
    </Field>
  );
}
