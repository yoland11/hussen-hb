import { dateFilterOptions, type DateFilterValue } from "@/lib/bookings/options";

type BookingFiltersProps = {
  search: string;
  dateFilter: DateFilterValue;
  onSearchChange: (value: string) => void;
  onDateFilterChange: (value: DateFilterValue) => void;
  onClear: () => void;
};

export function BookingFilters({
  search,
  dateFilter,
  onSearchChange,
  onDateFilterChange,
  onClear,
}: BookingFiltersProps) {
  return (
    <section className="card">
      <div className="ctitle">
        <div className="cicon">🔎</div>
        بحث وفلترة
      </div>

      <div className="search-grid">
        <div className="fld">
          <label htmlFor="search-box">بحث باسم العميل أو الهاتف</label>
          <input
            id="search-box"
            type="search"
            placeholder="ابحث هنا..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <div className="fld">
          <label htmlFor="date-filter">فلترة</label>
          <select
            id="date-filter"
            value={dateFilter}
            onChange={(event) =>
              onDateFilterChange(event.target.value as DateFilterValue)
            }
          >
            {dateFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button className="filter-btn" type="button" onClick={onClear}>
          مسح الفلترة
        </button>
      </div>
    </section>
  );
}
