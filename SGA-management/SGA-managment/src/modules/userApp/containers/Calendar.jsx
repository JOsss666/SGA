import React, { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";

import { FormButton } from "../components/FormButton";
import { SearchBar } from "../components/SearchBar";
import { AiResume } from "../components/AiResume";
import { useAppInfo } from "../../../context/context";
import "./Calendar.css";
import { NewElementSelect } from "../components/NewElementSelect";

export function Calendar() {

    const { darkMode, setDarkMode } = useAppInfo();

    const [date, setDate] = useState(new Date());
    const [searchVal, setSearchVal] = useState("");

    const calendarRef = useRef(null);

    const [categories, setCategories] = useState([
        { id: "cat1", name: "Programación", color: "#4c7cff" },
        { id: "cat2", name: "Evento", color: "#ff7043" },
        { id: "cat3", name: "Diario", color: "#8e44ad" }
    ]);

    const [selectedCategory, setSelectedCategory] = useState("cat1");


    const [events, setEvents] = useState([
        {
            id: "1",
            title: "Reunión de Coordinadores",
            start: "2025-12-16T09:00",
            end: "2025-12-16T11:00",
            extendedProps: { category: "cat1" },
            backgroundColor: "#4c7cff",
            borderColor: "#4c7cff"
        },
        {
            id: "2",
            title: "Probabilidad y estadística",
            start: "2025-12-16T13:00",
            end: "2025-12-16T15:00",
            extendedProps: { category: "cat2" },
            backgroundColor: "#ff7043",
            borderColor: "#ff7043"
        },
        {
            id: "3",
            title: "Taller Reforma de Médicos",
            start: "2025-12-18T10:00",
            end: "2025-12-18T12:00",
            extendedProps: { category: "cat3" },
            backgroundColor: "#8e44ad",
            borderColor: "#8e44ad"
        }
    ]);

    /** CREAR EVENTO **/
    const handleSelect = (info) => {
        const title = prompt("Nombre del evento:");
        if (!title) return;

        const categoryOptions = categories
        .map((c, i) => `${i + 1}. ${c.name}`)
        .join("\n");

        const catInput = prompt(
            `Selecciona una categoría:\n\n${categoryOptions}\n\nEscribe el número:`
        );

        const index = parseInt(catInput) - 1;
        const chosenCategory = categories[index];

        const color = chosenCategory?.color || "#4c7cff";

        const newEvent = {
            id: String(events.length + 1),
            title,
            start: info.start,
            end: info.end,
            extendedProps: {
                category: chosenCategory?.id || selectedCategory
            },
            backgroundColor: color,
            borderColor: color
        };

        setEvents([...events, newEvent]);
    };

    /** CLICK EVENTO **/
    const handleEventClick = (info) => {
        alert(`Evento: ${info.event.title}`);
    };

    /** IR A EVENTO DESDE SIDEBAR DERECHO **/
    const goToEvent = (eventId) => {
        const calendarApi = calendarRef.current?.getApi();
        if (!calendarApi) return;

        const event = calendarApi.getEventById(eventId);
        if (!event) return;

        calendarApi.gotoDate(event.start);

        const el = document.querySelector(`[data-event-id="${eventId}"]`);
        if (el) {
            el.classList.add("highlight-event");
            setTimeout(() => el.classList.remove("highlight-event"), 2000);
        }
    };

    /** RENDER TEXTO DEL EVENTO (sin cambiar color) **/
    const eventContent = (info) => (
        <div data-event-id={info.event.id} className="custom-event">
            {info.event.title}
        </div>
    );

    return (
        <div className={`Calendar ${darkMode ? "calendar-dark" : "calendar-light"}`}>

            <div className="SideBar SideBarLeft">
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateCalendar
                        value={date}
                        onChange={(newDate) => {
                            setDate(newDate);
                            const api = calendarRef.current?.getApi();
                            if (api && newDate) api.gotoDate(newDate);
                        }}
                        sx={{
                            width: '100%',
                            bgcolor: 'var(--cardHover)',
                            color: 'var(--descriptionText)',
                            borderRadius: 2,
                            display: 'flex',
                            flexDirection: 'column',

                            /* Layout principal */
                            '& .MuiPickersLayout-root': {
                                height: '100%',
                            },

                            /* Header fijo */
                            '& .MuiPickersCalendarHeader-root': {
                                flexShrink: 0,
                            },

                            /* Contenedor del calendario */
                            '& .MuiDayCalendar-root': {
                                flex: 1,
                                display: 'flex',
                                height:"50vh",
                                flexDirection: 'column',
                            },

                            /* Semanas → se reparten el alto */
                            '& .MuiDayCalendar-weekContainer': {
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                            },

                            /* Días → se centran */
                            '& .MuiPickersDay-root': {
                                flex: 1,
                                aspectRatio: '1 / 1',
                                maxWidth: 'fit-content',
                                color: 'var(--descriptionText)',
                                fontWeight: 500,
                                fontSize: 'clamp(0.75rem, 2vh, 1rem)',
                            },

                            '& .MuiPickersDay-root:hover': {
                                backgroundColor: 'var(--iconHover)',
                                color: 'var(--mainText)',
                            },

                            '& .MuiPickersDay-root.Mui-selected': {
                                backgroundColor: '#3b82f6',
                                color: '#fff',
                                fontWeight: 700,
                            },

                            '& .MuiPickersCalendarHeader-label': {
                                color: 'var(--mainText)',
                                fontSize: 'clamp(0.9rem, 2.5vh, 1.1rem)',
                            },

                            '& .MuiDayCalendar-weekDayLabel': {
                                color: 'var(--mainText)',
                                fontWeight: 500,
                                fontSize: 'clamp(0.65rem, 2vh, 0.85rem)',
                            },
                            }}/>

                </LocalizationProvider>
                <div className="Categories">
                    <ul>
                        <NewElementSelect title={'Agregar nueva categoría'} onClick={()=>{
                            const name = prompt("Nombre de la nueva categoría:");
                                if (!name) return;

                                const newCat = {
                                id: "cat" + (categories.length + 1),
                                name,
                                color: "#009688"
                                };

                                setCategories([...categories, newCat]);
                        }}/>
                        {categories.map(cat => (
                        <li
                            key={cat.id}
                            className={selectedCategory === cat.id ? "activeCategory" : ""}
                            onClick={() => setSelectedCategory(cat.id)}>
                                <span className="Dot" style={{ background: cat.color }} />
                            {cat.name}
                        </li>
                        ))}
                    </ul>
                </div>
            </div>


            <div className="CalendarBody">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="timeGridWeek"
                        headerToolbar={{
                        left: "title",
                        center: "",
                        right: "dayGridMonth,timeGridWeek,timeGridDay,prev,next today"
                        }}
                        buttonText={{
                            today: 'Hoy',
                            month: 'Mes',
                            week: 'Semana',
                            day: 'Día',
                        }}
                            slotLabelFormat={{
        hour: 'numeric',
        hour12: true
    }}
                        dayHeaderFormat={{ weekday: "short", day: "numeric" }}
                        slotMinTime="00:00:00"
                        slotMaxTime="24:00:00"
                        allDaySlot={false}
                        selectable={true}
                        editable={true}
                        events={events}
                        aspectRatio={1.32}
                        select={handleSelect}
                        eventClick={handleEventClick}
                        eventContent={eventContent}
                        locale={'es'}
                        eventDidMount={(info) => {
                            info.el.setAttribute("title", info.event.title);
                        }}
                        dateClick={(info) => setDate(info.date)}
                    />
            </div>


            <div className="SideBar SideBarRight">
                <SearchBar action={setSearchVal} placeholder={"Buscar Evento"} />
                <ul className="Events">
                    <li>
                        <NewElementSelect title={'Crear nuevo evento'}/>
                    </li>
                    {events.map(e => (
                    <li
                        key={e.id}
                        onClick={() => goToEvent(e.id)}
                        style={{ cursor: "pointer" }}
                    >
                        <i className="fa-regular fa-calendar" /> {e.title}
                    </li>
                    ))}
                </ul>
                <AiResume />
            </div>
        </div>
    );
}
