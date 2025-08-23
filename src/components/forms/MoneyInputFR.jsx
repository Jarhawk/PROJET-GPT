import NumericInput from './NumericInput';

export default function MoneyInputFR({ value, onChange, decimals = 2, ...props }) {
  return (
    <NumericInput
      value={value}
      onValueChange={onChange}
      decimals={decimals}
      {...props}
    />
  );
}
