import NumericInput from './NumericInput';

export default function NumericInputFR({ value, onChange, ...props }) {
  return (
    <NumericInput
      value={value}
      onValueChange={onChange}
      {...props}
    />
  );
}
