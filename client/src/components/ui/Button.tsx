type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost"; asLinkTo?: string; };
export function Button({ variant="primary", asLinkTo, className="", ...rest }: Props){
  const cls = `btn ${variant==="primary"?"btn-primary":"btn-ghost"} ${className}`;
  if (asLinkTo) return <a href={asLinkTo} className={cls} {...(rest as any)} />;
  return <button className={cls} {...rest} />;
}
