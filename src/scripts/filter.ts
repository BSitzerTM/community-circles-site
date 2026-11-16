/*
 * TABLE AND LIST FILTERS
 *
 * Any element marked `data-filter-root` can be filtered. Inside it:
 *   - `data-filter-control` marks a <select> or <input> that filters.
 *       `data-filter-key="circle"`  says which data attribute to compare.
 *       `data-match="contains"`     does a case-insensitive text search.
 *       `data-match="min"` / `"max"` compares dates (from / to).
 *       Anything else needs an exact match.
 *   - `data-filter-item` marks each row or list item, and carries the
 *     values to compare in data attributes (e.g. data-circle="events-circle").
 *   - `data-filter-count` (optional) shows "3 of 10 shown".
 *   - `data-filter-empty` (optional) is shown when nothing matches.
 *
 * Without JavaScript every row stays visible, so the page still works.
 */

type Control = HTMLInputElement | HTMLSelectElement;

function matches(item: HTMLElement, control: Control): boolean {
  const value = control.value.trim();
  if (!value) return true; // An empty filter matches everything.

  const actual = item.dataset[control.dataset.filterKey ?? ''] ?? '';
  switch (control.dataset.match) {
    case 'contains':
      return actual.toLowerCase().includes(value.toLowerCase());
    case 'min':
      return actual >= value;
    case 'max':
      return actual !== '' && actual <= value;
    default:
      return actual === value;
  }
}

export function initFilters(): void {
  document.querySelectorAll<HTMLElement>('[data-filter-root]').forEach((root) => {
    const controls = Array.from(root.querySelectorAll<Control>('[data-filter-control]'));
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-filter-item]'));
    const count = root.querySelector<HTMLElement>('[data-filter-count]');
    const empty = root.querySelector<HTMLElement>('[data-filter-empty]');

    const apply = () => {
      let shown = 0;
      for (const item of items) {
        const visible = controls.every((control) => matches(item, control));
        item.hidden = !visible;
        if (visible) shown += 1;
      }
      if (count) count.textContent = `${shown} of ${items.length} shown`;
      if (empty) empty.hidden = shown !== 0;
    };

    controls.forEach((control) => {
      control.addEventListener('input', apply);
      control.addEventListener('change', apply);
    });
    apply();
  });
}
