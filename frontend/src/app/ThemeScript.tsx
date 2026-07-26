// Injected before first paint to apply the correct theme class without flash.
// Must be a Server Component that renders a <script> tag — not a client component.
export function ThemeScript() {
  const script = `
    (function() {
      try {
        var ui = JSON.parse(localStorage.getItem('signal-ui') || '{}');
        var theme = ui.state?.theme || 'dark';
        var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) document.documentElement.classList.add('dark');
      } catch (e) {
        document.documentElement.classList.add('dark');
      }
    })();
  `.trim()

  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
