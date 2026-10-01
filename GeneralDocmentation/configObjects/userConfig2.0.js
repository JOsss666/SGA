const userConfig = {
    meta: {
        schemaVersion: 2,
        revision: 1,
        updatedAt: null // Lo establece el servidor.
    },

    appearance: {
        theme: {
            mode: "light", // light | dark | system
            palette: "default"
        },

        background: {
            mode: "default", // default | image | none
            images: {
                light: null,
                dark: null
            }
        },

        typography: {
            fontFamily: "system",
            fontScale: 1,
            lineHeight: "normal" // normal | relaxed
        },

        iconography: {
            size: "medium", // small | medium | large
            showImages: true
        }
    },

    accessibility: {
        contrast: "normal", // normal | high
        motion: "system" // system | full | reduced | none
    },

    regional: {
        locale: "es-CO",
        hourCycle: "h23", // h12 | h23
        dateFormat: "DD/MM/YYYY",

        // Preferencia para mostrar horas generales.
        // No modifica la zona comercial de los informes.
        timeZone: {
            source: "company", // company | device | custom
            value: null // Zona IANA cuando source es custom.
        }
    },

    workspace: {
        navigation: {
            sidebarMode: "expanded", // expanded | collapsed
            showLabels: true,
            favorites: []
        },

        dashboard: {
            layout: "default",
            density: "comfortable", // compact | comfortable
            widgets: {
                visible: true,
                preset: "all", // all | essential | custom
                order: [],
                hiddenIds: []
            }
        },

        tables: {
            defaults: {
                density: "comfortable",
                showTotals: true,
                wrapText: false
            },

            // Preferencias por tabla, usando identificadores estables.
            byId: {}
        }
    },

    notifications: {
        presentation: {
            mode: "toast", // toast | panel | bubble | silent
            durationMs: 5000,
            groupBy: "none", // none | module | type
            soundEnabled: false
        },

        quietHours: {
            enabled: false,
            startTime: "22:00",
            endTime: "07:00"
        },

        digest: {
            frequency: "off", // off | daily | weekly
            deliveryTime: "08:00",
            weekDay: 1 // Se usa solo para weekly: 1=lunes.
        },

        subscriptions: {
            processes: false
        }
    },

    realTime: {
        // Controla cuándo aplicar novedades en pantalla.
        refreshMode: "automatic", // automatic | manual
        pauseWhileEditing: true
    },

    privacy: {
        sessionRecordingConsent: false
    },

    // Solo diferencias respecto de las preferencias generales.
    modules: {
        facturation: {},
        zj: {}
    }
};