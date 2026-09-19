const apiBaseUrl = "https://sga-2zgp.onrender.com";

export async function getProcessAdministrationReport(companyId) {
    const response = await fetch(`${apiBaseUrl}/nexo360/getProcessAdministrationReport`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-SGA-Company-Id": String(companyId)
        },
        body: JSON.stringify({ company_id: companyId })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw error;
    }

    return response.json();
}
