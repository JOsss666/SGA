import { BoldTitle } from "../../components/BoldTitle";
import './ServicePolicy.css'

// Fecha de última actualización de la política (ajústala al publicar cambios).
const LAST_UPDATE = '3 de octubre de 2025';

// Datos del responsable. Reemplaza los valores entre corchetes por la información
// legal real de la empresa antes de publicar.
const COMPANY = {
    legalName:'KXA S.A.S',
    nit:'10345127196',
    city:'Bogotá, Colombia',
    contactEmail:'murillojose.nvc@gmail.com',
    productName:'SGA360'
};

// Cada sección es {title, paragraphs:[]}. Así es fácil agregar, quitar o reordenar.
const policySections = [
    {
        title:'1. Aceptación de los términos',
        paragraphs:[
            `Al registrarte, acceder o utilizar ${COMPANY.productName} (en adelante, "la Plataforma"), declaras haber leído, entendido y aceptado estos Términos de Uso y la Política de Privacidad. Si actúas en nombre de una empresa, manifiestas que cuentas con facultades suficientes para obligarla al cumplimiento de estas condiciones.`,
            `Si no estás de acuerdo con alguna parte de este documento, debes abstenerte de usar la Plataforma.`
        ]
    },
    {
        title:'2. Descripción del servicio',
        paragraphs:[
            `${COMPANY.productName} es una plataforma de software como servicio (SaaS) orientada a la gestión administrativa, comercial, de inventario, tesorería y facturación electrónica. La Plataforma permite registrar terceros, emitir y administrar documentos, controlar impuestos y retenciones, y generar reportes, entre otras funcionalidades.`,
            `Nos reservamos el derecho de modificar, ampliar o descontinuar funcionalidades para mejorar el servicio, procurando no afectar de manera sustancial las operaciones en curso de los usuarios.`
        ]
    },
    {
        title:'3. Registro y cuenta de usuario',
        paragraphs:[
            `Para usar la Plataforma debes crear una cuenta con información veraz, completa y actualizada. Eres responsable de mantener la confidencialidad de tus credenciales y de toda actividad realizada desde tu cuenta.`,
            `Debes notificarnos de inmediato ante cualquier uso no autorizado o pérdida de credenciales. No nos hacemos responsables por daños derivados del incumplimiento de estas obligaciones de seguridad por parte del usuario.`
        ]
    },
    {
        title:'4. Uso aceptable',
        paragraphs:[
            `Te comprometes a utilizar la Plataforma conforme a la ley y a estos términos. Queda prohibido: (i) usar el servicio para fines ilícitos o fraudulentos; (ii) intentar vulnerar la seguridad o integridad del sistema; (iii) acceder a datos de otros usuarios sin autorización; (iv) realizar ingeniería inversa, copiar o revender el servicio; y (v) cargar contenido que infrinja derechos de terceros.`,
            `El incumplimiento de estas reglas podrá dar lugar a la suspensión o terminación de la cuenta, sin perjuicio de las acciones legales aplicables.`
        ]
    },
    {
        title:'5. Facturación electrónica y obligaciones fiscales',
        paragraphs:[
            `La Plataforma facilita la generación y transmisión de documentos electrónicos ante las autoridades competentes (como la DIAN) y proveedores tecnológicos autorizados. El usuario es el único responsable de la exactitud, veracidad y oportunidad de la información tributaria y contable que registre, así como del cumplimiento de sus obligaciones fiscales.`,
            `${COMPANY.productName} actúa como herramienta de apoyo y no sustituye la asesoría contable, tributaria o legal profesional.`
        ]
    },
    {
        title:'6. Planes, pagos y renovación',
        paragraphs:[
            `El acceso a determinadas funcionalidades puede estar sujeto al pago de un plan o suscripción, según las condiciones y tarifas vigentes al momento de la contratación. Los pagos no son reembolsables salvo que la ley aplicable o un acuerdo expreso dispongan lo contrario.`,
            `Las suscripciones podrán renovarse automáticamente según el plan contratado. El impago podrá derivar en la limitación o suspensión del acceso al servicio.`
        ]
    },
    {
        title:'7. Propiedad intelectual',
        paragraphs:[
            `El software, la marca, los logotipos, el diseño, el código y demás elementos de la Plataforma son propiedad de ${COMPANY.legalName} o de sus licenciantes, y están protegidos por las normas de propiedad intelectual. El uso de la Plataforma no concede al usuario ningún derecho de propiedad sobre dichos elementos.`,
            `La información y los datos que el usuario carga en la Plataforma siguen siendo de su propiedad; el usuario nos otorga una licencia limitada para tratarlos con el fin de prestar el servicio.`
        ]
    },
    {
        title:'8. Disponibilidad y soporte',
        paragraphs:[
            `Trabajamos para mantener la Plataforma disponible de forma continua; sin embargo, el servicio puede verse interrumpido por mantenimientos programados, fallas técnicas o causas de fuerza mayor. No garantizamos una disponibilidad ininterrumpida ni libre de errores.`,
            `El soporte se brinda a través de los canales oficiales informados dentro de la Plataforma.`
        ]
    },
    {
        title:'9. Limitación de responsabilidad',
        paragraphs:[
            `En la máxima medida permitida por la ley, ${COMPANY.legalName} no será responsable por daños indirectos, lucro cesante, pérdida de datos o perjuicios derivados del uso o la imposibilidad de uso de la Plataforma. El servicio se presta "tal cual" y "según disponibilidad".`,
            `El usuario es responsable de mantener copias y respaldos de la información que considere crítica.`
        ]
    },
    {
        title:'10. Suspensión y terminación',
        paragraphs:[
            `Podemos suspender o terminar el acceso a la Plataforma ante incumplimientos de estos términos, uso indebido, riesgos de seguridad o requerimientos legales. El usuario puede solicitar la cancelación de su cuenta en cualquier momento mediante los canales oficiales.`,
            `Tras la terminación, conservaremos o eliminaremos los datos según lo previsto en la Política de Privacidad y la normativa aplicable.`
        ]
    },
    {
        title:'11. Responsable del tratamiento de datos',
        paragraphs:[
            `El responsable del tratamiento de los datos personales es ${COMPANY.legalName}, identificada con NIT ${COMPANY.nit}, domiciliada en ${COMPANY.city}. Para cualquier solicitud relacionada con datos personales puedes escribir a ${COMPANY.contactEmail}.`,
            `Esta Política de Privacidad se rige por la Ley 1581 de 2012, el Decreto 1377 de 2013 y demás normas colombianas sobre protección de datos personales (Habeas Data).`
        ]
    },
    {
        title:'12. Datos que recolectamos',
        paragraphs:[
            `Recolectamos: (i) datos de registro e identificación (nombre, documento, correo, teléfono); (ii) datos de la empresa y de sus terceros (clientes, proveedores, empleados) cargados por el usuario; (iii) datos transaccionales, contables y fiscales; y (iv) datos técnicos de uso (dirección IP, dispositivo, registros de actividad).`,
            `El usuario que carga datos de terceros declara contar con la autorización necesaria para tratarlos y compartirlos con la Plataforma.`
        ]
    },
    {
        title:'13. Finalidades del tratamiento',
        paragraphs:[
            `Tratamos los datos para: prestar y administrar el servicio; permitir la facturación electrónica y el cumplimiento de obligaciones legales y fiscales; gestionar pagos y suscripciones; brindar soporte; mejorar la Plataforma y su seguridad; y enviar comunicaciones operativas o comerciales relacionadas con el servicio.`
        ]
    },
    {
        title:'14. Compartición con terceros',
        paragraphs:[
            `Podemos compartir datos con proveedores tecnológicos y de infraestructura que nos ayudan a operar la Plataforma (por ejemplo, alojamiento en la nube, almacenamiento de archivos, proveedores de facturación electrónica y pasarelas de pago), así como con autoridades cuando la ley lo exija.`,
            `Estos terceros tratan la información únicamente conforme a nuestras instrucciones y con medidas de protección adecuadas. No vendemos datos personales.`
        ]
    },
    {
        title:'15. Seguridad de la información',
        paragraphs:[
            `Aplicamos medidas técnicas, administrativas y organizativas razonables para proteger la información contra accesos no autorizados, pérdida o alteración, incluyendo cifrado en tránsito y controles de acceso. Ningún sistema es completamente infalible, por lo que no podemos garantizar seguridad absoluta.`
        ]
    },
    {
        title:'16. Conservación de los datos',
        paragraphs:[
            `Conservamos los datos mientras exista la relación con el usuario y durante los plazos exigidos por las obligaciones legales, contables y fiscales aplicables. Cumplidos dichos plazos, los datos se eliminan o anonimizan de forma segura.`
        ]
    },
    {
        title:'17. Derechos del titular (Habeas Data)',
        paragraphs:[
            `Como titular de datos personales tienes derecho a conocer, actualizar, rectificar y suprimir tus datos, así como a revocar la autorización otorgada, en los términos de la ley. Para ejercer estos derechos puedes escribir a ${COMPANY.contactEmail}, indicando tu solicitud y acreditando tu identidad.`,
            `Atenderemos tu solicitud dentro de los plazos legales. También puedes presentar reclamaciones ante la Superintendencia de Industria y Comercio (SIC).`
        ]
    },
    {
        title:'18. Cookies y tecnologías similares',
        paragraphs:[
            `La Plataforma puede utilizar cookies y tecnologías similares para mantener la sesión, recordar preferencias y analizar el uso del servicio. Puedes configurar tu navegador para gestionar o deshabilitar las cookies, teniendo en cuenta que algunas funciones podrían verse afectadas.`
        ]
    },
    {
        title:'19. Cambios a esta política',
        paragraphs:[
            `Podemos actualizar estos Términos de Uso y la Política de Privacidad para reflejar cambios legales, técnicos o del servicio. Publicaremos la versión vigente en la Plataforma e indicaremos la fecha de última actualización. El uso continuado del servicio tras los cambios implica su aceptación.`
        ]
    },
    {
        title:'20. Contacto',
        paragraphs:[
            `Para preguntas sobre estos términos o el tratamiento de tus datos, contáctanos en ${COMPANY.contactEmail}.`
        ]
    }
];

export function ServicePolicy({}){
    return(
        <div className="ServicePolicy">
            <div className="headPolicy">
                <img src="https://cdnmain.sga360.co/static/Gemini_Generated_Image_fx4nzmfx4nzmfx4n-2_fizk0g.webp" alt="" />
                <BoldTitle text={'Politica de uso y privacidad'}/>
                <span>Importante leer y estar al tanto de estas actualizaciones</span>
                <span>Última actualización: {LAST_UPDATE}</span>
            </div>
            {policySections.map((section,index)=>(
                <section key={index}>
                    <strong>{section.title}</strong>
                    {section.paragraphs.map((paragraph,pIndex)=>(
                        <p key={pIndex}>{paragraph}</p>
                    ))}
                </section>
            ))}
        </div>
    )
}
