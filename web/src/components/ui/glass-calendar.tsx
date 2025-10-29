import * as React from "react";
import { Settings, Plus, Edit2, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, isSameDay, isToday, getDate, getDaysInMonth, startOfMonth } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// --- TYPE DEFINITIONS ---
interface Day {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
}

interface GlassCalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  className?: string;
}

// --- HELPER TO HIDE SCROLLBAR ---
const ScrollbarHide = () => (
  <style>{`
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `}</style>
);

// --- MAIN COMPONENT ---
export const GlassCalendar = React.forwardRef<HTMLDivElement, GlassCalendarProps>(
  ({ className, selectedDate: propSelectedDate, onDateSelect, ...props }, ref) => {
    const [currentMonth, setCurrentMonth] = React.useState(propSelectedDate || new Date());
    const [selectedDate, setSelectedDate] = React.useState(propSelectedDate || new Date());

    // Generate all days for the current month
    const monthDays = React.useMemo(() => {
        const start = startOfMonth(currentMonth);
        const totalDays = getDaysInMonth(currentMonth);
        const days: Day[] = [];
        for (let i = 0; i < totalDays; i++) {
            const date = new Date(start.getFullYear(), start.getMonth(), i + 1);
            days.push({
                date,
                isToday: isToday(date),
                isSelected: isSameDay(date, selectedDate),
            });
        }
        return days;
    }, [currentMonth, selectedDate]);

    const handleDateClick = (date: Date) => {
      setSelectedDate(date);
      onDateSelect?.(date);
    };
    
    const handlePrevMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    return (
      <div
        ref={ref}
        className={cn(
          "w-full max-w-[360px] rounded-3xl p-5 shadow-2xl overflow-hidden",
          "bg-white/95 backdrop-blur-xl border border-gray-200/50",
          "text-gray-900 font-sans",
          className
        )}
        {...props}
      >
        <ScrollbarHide />
        {/* Header: Tabs and Settings */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 rounded-lg bg-gray-100 p-1">
            <button className="rounded-md bg-white px-4 py-1 text-xs font-bold text-gray-900 shadow-sm">
              Weekly
            </button>
            <button className="rounded-md px-4 py-1 text-xs font-semibold text-gray-600 transition-colors hover:text-gray-900">
              Monthly
            </button>
          </div>
          <button className="p-2 text-gray-600 transition-colors hover:bg-gray-100 rounded-full">
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Date Display and Navigation */}
        <div className="my-6 flex items-center justify-between">
            <motion.p 
              key={format(currentMonth, "MMMM")}
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3 }}
              className="text-4xl font-bold tracking-tight text-gray-900"
            >
                {format(currentMonth, "MMMM")}
            </motion.p>
            <div className="flex items-center space-x-2">
                <button onClick={handlePrevMonth} className="p-1 rounded-full text-gray-600 transition-colors hover:bg-gray-100">
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={handleNextMonth} className="p-1 rounded-full text-gray-600 transition-colors hover:bg-gray-100">
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>
        </div>

        {/* Scrollable Monthly Calendar Grid */}
        <div className="overflow-x-auto scrollbar-hide -mx-5 px-5">
            <div className="flex space-x-4">
                {monthDays.map((day) => (
                    <div key={format(day.date, "yyyy-MM-dd")} className="flex flex-col items-center space-y-2 flex-shrink-0">
                        <span className="text-xs font-bold text-gray-500">
                            {format(day.date, "E").charAt(0)}
                        </span>
                        <button
                            onClick={() => handleDateClick(day.date)}
                            className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 relative",
                                {
                                    "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg": day.isSelected,
                                    "hover:bg-gray-100": !day.isSelected,
                                    "text-gray-900": !day.isSelected,
                                }
                            )}
                        >
                            {day.isToday && !day.isSelected && (
                                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-blue-500"></span>
                            )}
                            {getDate(day.date)}
                        </button>
                    </div>
                ))}
            </div>
        </div>
        
        {/* Divider */}
        <div className="mt-6 h-px bg-gray-200" />

        {/* Footer Actions */}
        <div className="mt-4 flex items-center justify-between space-x-4">
           <button className="flex items-center space-x-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
             <Edit2 className="h-4 w-4" />
             <span>Add a note...</span>
           </button>
           <button className="flex items-center space-x-2 rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-900 shadow-sm transition-colors hover:bg-gray-200">
             <Plus className="h-4 w-4" />
             <span>New Event</span>
           </button>
        </div>
      </div>
    );
  }
);

GlassCalendar.displayName = "GlassCalendar";
