import { useLayoutContext } from "@/context/LayoutContext";


interface DatePickerProps{
    mode: "single" | "range";
    variant: 'docked' | 'floating';
    
}

const DatePicker = (props: DatePickerProps) => {

    const { layout } = useLayoutContext() || {};
    const { mode, variant } = props;

  return (
    <div>DatePicker</div>
  )
}

export default DatePicker