import {
  FieldValues,
  SubmitHandler,
  UseFormProps,
  UseFormReturn,
  useForm,
} from "react-hook-form";

export function useFormAction<
  TFieldValues extends FieldValues = FieldValues,
  TContext = any,
  TTransformedValues extends FieldValues | undefined = undefined,
>(props?: UseFormProps<TFieldValues, TContext>) {
  const form = useForm<TFieldValues, TContext, TTransformedValues>(props);

  const handleAction = async <T>(
    onAction: (data: TFieldValues) => Promise<T>
  ) => {
    const valid = await form.trigger();
    if (valid) {
      return onAction(form.getValues()) as T;
    }
  };

  return {
    ...form,
    handleAction,
  };
}
