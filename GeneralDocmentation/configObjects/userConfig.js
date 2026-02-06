let unserConfic = {
  "meta": {
    "version": "1.0",
    "updatedAt": "2026-01-10"
  },
  "access": {
    "stores": {
      "enabled": [
        6
      ],
      "overAll": false
    },
    "cellars": {
      "enabled": [],
      "overAll": true
    },
    "modules": {
      "ctools": {
        "use": false,
        "expires": "never",
        "instance": "alpha"
      },
      "process": {
        "use": true,
        "expires": "10/01/2026",
        "instance": "full"
      },
      "sga-home": {
        "use": true,
        "expires": "never",
        "instance": "full"
      },
      "treasury": {
        "use": true,
        "expires": "10/01/2026",
        "instance": "full",
        "facturation": true
      },
      "inventory": {
        "use": true,
        "expires": "10/01/2026",
        "instance": "full"
      },
      "certicloud": {
        "use": false,
        "expires": "never",
        "instance": "alpha"
      },
      "management": {
        "use": true,
        "expires": "10/01/2026",
        "instance": "full"
      },
      "contability": {
        "use": true,
        "expires": "10/01/2026",
        "instance": "full"
      },
      "facturation": {
        "use": true,
        "expires": "10/01/2026",
        "instance": "full"
      }
    },
    "bussines": {
      "enabled": [
        4
      ],
      "overAll": false
    },
    "payments": {
      "can_pay": true,
      "payment_methods": {
        "enabled": [],
        "overAll": true
      }
    },
    "sections": {
      "new": {
        "overAll": true
      },
      "help": {
        "overAll": true
      },
      "users": {
        "overAll": false,
        "can_edit": false,
        "can_create": false,
        "can_delete": false
      },
      "search": {
        "overAll": false
      },
      "stores": {
        "overAll": false
      },
      "billing": {
        "overAll": false
      },
      "modules": {
        "overAll": false
      },
      "reports": {
        "company": {
          "testBalane": true,
          "executionState": true,
          "operative-cost": true,
          "processEfficiency": true,
          "usersProductivity": true
        },
        "overAll": true,
        "documents": {
          "sells": true,
          "consume": true,
          "overAll": true,
          "purchase": true,
          "clientOrders": true,
          "reportedDocs": true,
          "transactions": true,
          "productionOrders": true,
          "clientOrdersVolume": true
        }
      },
      "accounts": {
        "overAll": true
      },
      "concepts": {
        "overAll": true,
        "enabled": [35,36,37]
      },
      "products": {
        "overAll": true
      },
      "services": {
        "overAll": true
      },
      "settings": {
        "overAll": true
      },
      "analytics": {
        "overAll": true
      },
      "movements": {
        "overAll": true
      },
      "tutorials": {
        "overAll": true
      },
      "categories": {
        "overAll": true
      },
      "myBussines": {
        "overAll": true
      },
      "pricesList": {
        "overAll": true
      },
      "newDocument": {
        "overAll": true,
        "can_edit": false,
        "can_create": true,
        "can_delete": false,
        "can_report": false,
        "can_comment": false,
        "allowedDocuments": []
      },
      "controlPanel": {
        "overAll": false
      },
      "thirdparties": {
        "overAll": true,
        "can_edit": false,
        "can_create": false,
        "can_delete": false
      }
    },
    "services": {
      "sga": {
        "AI": {
          "use": true,
          "expires": "never",
          "instance": "full"
        },
        "mail": {
          "use": false,
          "expires": "never",
          "instance": "full"
        },
        "calendar": {
          "use": false,
          "expires": "never",
          "instance": "full"
        },
        "analytics": {
          "use": false,
          "expires": "never",
          "instance": "full"
        },
        "messaging": {
          "use": true,
          "expires": "never",
          "instance": "full"
        },
        "advertising": {
          "use": false,
          "expires": "never",
          "instance": "full"
        },
        "cloud-storage": {
          "use": true,
          "limint": "never-",
          "expires": "never",
          "instance": "full"
        }
      },
      "personalized": {}
    },
    "suspended": false,
    "costCenters": {
      "enabled": [
        41
      ],
      "overAll": false
    },
    "information": {
      "utilities": {
        "overAll": true,
        "thirdParties": true,
        "onlyOwnInformation": false
      }
    },
    "process_instances": {
      "enabled": [],
      "overAll": true
    }
  },
  "styles": {
    "theme": {
      "darkImg": "https://i.pinimg.com/1200x/80/d1/bd/80d1bd8f8c9777a8ff1a8b4ed534418e.jpg",
      "default": "light",
      "ligthImg": "https://i.pinimg.com/1200x/23/5f/8d/235f8df39cf98153029b9cc09495f390.jpg",
      "colorPalete": "default"
    },
    "tables": {
      "editable": false
    },
    "widgets": {
      "editable": false,
      "show-widgets": true,
      "only-escentials": false
    },
    "dashboard": {
      "editable": false,
      "distribution": "normal"
    },
    "animations": {
      "speed": "normal",
      "active": true,
      "only-escentials": false
    },
    "typography": {
      "style": "normal",
      "contrast": "normal",
      "font-size": "normal",
      "line-width": "auto",
      "line-height": "auto"
    },
    "iconography": {
      "show-imgs": true,
      "icons-size": "normal",
      "only-icons": false
    }
  },
  "system": {
    "hour": "local",
    "region": "Colombia",
    "language": "es"
  },
  "account": {
    "locked": false,
    "status": "active",
    "recordSesion": false
  },
  "security": {
    "authentication": {
      "logIn": {
        "allways": false,
        "keyWord": "",
        "backUpMethod": false
      },
      "logOut": {
        "never": false,
        "frecuncy": "dayly"
      },
      "devices": {
        "limit": 3,
        "allow-multiple": true
      },
      "biometricData": {
        "enable": false,
        "requirePin": false
      },
      "two-steps-verification": {
        "enable": false,
        "backup-method": "tel-code",
        "default-method": "email-code"
      }
    }
  },
  "notifications": {
    "mode": "float",
    "focus": "disabled",
    "sound&efects": false,
    "programedResume": "disabled",
    "groupNotifications": false
  }
}