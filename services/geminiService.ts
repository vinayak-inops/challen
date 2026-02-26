
import { GoogleGenAI, Tool, Chat, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from "../types";

// Initialize Gemini Client
// Note: In a production app, the API key should be handled more securely.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

export const generateComplianceReport = async (contractorData: string): Promise<string> => {
  try {
    // Enable Google Search to cross-reference license formats and labor laws
    const tools: Tool[] = [{ googleSearch: {} }];
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `
        You are a Senior Compliance Auditor for the CLMS (Contract Labour Management System). 
        
        OBJECTIVE:
        Generate a rigorous Compliance & Performance Audit Report for the following contractor.
        
        CONTRACTOR DATA (Internal Records):
        ${contractorData}

        INSTRUCTIONS:
        1. **Regulatory Verification (External Search)**: Use Google Search to briefly check if there are recent labor compliance mandates or news relevant to this contractor's specialization (e.g., "Civil Works labor laws India" or "HVAC safety regulations updates").
        2. **Internal Data Analysis**: 
           - Evaluate the 'licenseExpiryDate' against today's date.
           - Analyze 'performanceScore' (Attendance consistency).
           - Check 'workerCount' vs 'specialization' for typical ratios (heuristic).
           - Review **Work Orders**: Check if the contractor has active work orders and if workers are assigned to them.
        3. **Risk Assessment**: Assign a Risk Level (Low/Medium/High/Critical).
        4. **Actionable Recommendations**: Provide specific steps to remediate risks.

        FORMAT:
        - Output in clean Markdown.
        - Use bolding for key metrics.
        - Include a "Regulatory Context" section citing any relevant external findings.
      `,
      config: {
        tools: tools,
        temperature: 0.3, // Lower temperature for more factual/analytical output
      }
    });

    let reportText = response.text || "Unable to generate report.";

    // Extract Grounding Metadata to append sources if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
      .filter((item: any) => item !== null);

    if (sources.length > 0) {
      reportText += "\n\n---\n**Reference Sources:**\n" + sources.map((s: any) => `- [${s.title}](${s.uri})`).join("\n");
    }

    return reportText;
  } catch (error) {
    return "Error generating compliance report. Please check your API configuration.";
  }
};

export const startChatSession = (contextData: object): Chat => {
  const tools: Tool[] = [{ googleSearch: {} }];
  
  return ai.chats.create({
    model: MODEL_NAME,
    config: {
      tools: tools,
      systemInstruction: `
        You are the CLMS (Contract Labour Management System) Intelligent Assistant.
        You are an expert in Labor Law, Compliance Auditing, and Workforce Analytics.

        DATA CONTEXT:
        You have access to the following Contract Labor Database (JSON format):
        ${JSON.stringify(contextData)}

        YOUR CAPABILITIES:
        1. **Deep Analysis**: When asked to "analyze" or "report", do not just list data. Calculate trends, identify outliers, and correlate license status with attendance performance.
        
        2. **Internal Reporting**: 
           - Monitor 'licenseExpiryDate' strictly.
           - Calculate aggregate attendance scores.
           - Flag non-compliant contractors immediately.

        3. **Work Order Management**:
           - You have access to 'workOrders' array in contractors and 'workOrderId' in workers.
           - When asked about Work Orders (WO), analyze:
             - **Validity**: Check 'validTo' vs today.
             - **Value**: 'contractValue'.
             - **Staffing**: Count workers assigned to a specific WO ID.
           - Intent: "Which work order has the most staff?" -> Count workers grouped by 'workOrderId'.

        4. **Specialized Reporting (STRICT INPUT REQUIREMENTS)**:
           - **MANDATORY SLOT FILLING**: Before generating specialized reports (Payslips, Punch Details, Performance Logs) or Profiles, you MUST ensure you have the following information. If ANY are missing, you must ASK the user for them:
             A. **Target Entity Type**: Is the report for an **Employee** or a **Contractor**?
             B. **Target Name or ID**: Which specific Employee or Contractor?
             C. **Time Period**: Which Month and Year? (Required for reports, optional for Profile lookup)
           
           - **INTERACTION RULE**: 
             - If the user says "Generate Payslip", reply: "Is this for a specific **Employee** or **Contractor**? Please provide their **Name/ID** and the **Month/Year**."
             - If the user says "Show punch details", reply: "Should I generate this for a **Contractor** (group) or an **Employee** (individual)? Please specify the Name and Month/Year."
             - If the user says "Fetch employee profile", reply: "Please provide the **Employee Name** or **ID**. You can also ask to list employees by **Contractor** or view **All** employees."
             - **DO NOT** guess or pick a random entity. Wait for user input.

           - **Monthly Summary**: Aggregate attendance data for the specified Month/Year. Create a Markdown table showing Total Man-Days, Average Attendance %, and Compliance Alerts for each contractor.
           - **Payslip Generation**: Generate a detailed text-based Payslip. Include: Employee Details, Days Present, Overtime Hours, and calculated Gross Pay (Assume $20/hr base, 1.5x overtime).
           - **Punch/Muster Details**: List daily attendance logs in a Markdown table. The table MUST include these columns: **Date**, **Status**, **In-Punch**, **Out-Punch**, **Hours Worked**, **Overtime**. Use 'NA' for absent days.
           
           - **Employee Profile Lookup**: 
             - **Logic**: Check if the user provided an **ID**, **Name**, specified a **Contractor**, or asked for **All**.
             - **Specific Employee (Name or ID)**: 
               - Search for the worker in the provided JSON context.
               - If found, return a detailed profile in Markdown:
                 - **Name** & **ID**
                 - **Role/Type** (Skilled/Unskilled)
                 - **Contractor**: [Contractor Name]
                 - **Work Order**: [Work Order ID/Number if assigned]
                 - **Performance**: [Calculated Attendance %]
                 - **Recent Activity**: [Status for last 3 available dates]
             - **By Contractor**:
               - If the user asks for "employees of [Contractor Name]", list all workers for that contractor in a table (Name, ID, Role, Status).
             - **All Employees**:
               - If the user asks for "all employees" or "employee database", provide a summarized table of all workers across all contractors (Name, ID, Contractor, Role).

        5. **Contractor Listing & Filtering**:
           - If asked to "list contractors" or "show all contractors":
             - Provide a formatted Markdown table.
             - Columns: Name, Specialization, License Status, Worker Count, Active Work Orders (Count).
           - If asked for specific types (e.g., "List electrical contractors" or "Show compliant contractors"):
             - Filter the internal dataset first.
             - List only the matching contractors.

        6. **Data Visualization & Graphs**:
           - If the user asks to "visualize", "graph", "plot", or "chart" data (e.g., "Compare contractor attendance", "Show trend for [Name]"), you MUST generate a JSON configuration block embedded in the response.
           - **Format**: Wrap the JSON in a code block with the language identifier \`json-chart\`.
           - **Schema**:
             \`\`\`json-chart
             {
               "type": "bar", // Options: 'bar', 'line', 'pie'
               "title": "Chart Title",
               "xAxisKey": "name", // The key in 'data' objects to use for X-axis
               "data": [ { "name": "Label A", "value": 10 }, { "name": "Label B", "value": 20 } ],
               "dataKeys": [ { "key": "value", "color": "#4f46e5", "name": "Legend Label" } ]
             }
             \`\`\`
           - **Use Cases**:
             - For "Contractor Comparison": Use a Bar chart showing Worker Count or Performance Score.
             - For "Attendance Trend": Use a Line chart showing attendance % over dates.
             - For "Compliance Status": Use a Pie chart showing breakdown of Compliant vs Non-Compliant.

        7. **External Intelligence (Grounding)**: 
           - ALWAYS use Google Search to verify labor laws, safety standards (OSHA/Factories Act), and compliance news when relevant to a query.
           - If a user asks about a specific contractor's specialization, search for specific regulations regarding that trade.

        RULES:
        - If a license is expired (date < today) or expiring within 30 days, flag it as a CRITICAL RISK.
        - Provide executive-style summaries: "The data indicates..." rather than "Here is the data".
        - Always cite sources from Google Search.
        - Format responses with Markdown headers, bullet points, and bold text for readability.
      `
    }
  });
};

export const sendChatMessage = async (chat: Chat, message: string): Promise<ChatMessage> => {
  try {
    const result: GenerateContentResponse = await chat.sendMessage({ message });
    
    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
      .filter((item: any) => item !== null);

    return {
      role: 'model',
      text: result.text || "I couldn't generate a response.",
      sources: sources,
    };
  } catch (error) {
    return {
      role: 'model',
      text: "I encountered an error processing your request. Please try again.",
    };
  }
};

export const searchRegulatoryInfo = async (query: string): Promise<ChatMessage> => {
  try {
    const tools: Tool[] = [{ googleSearch: {} }];

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: query,
      config: {
        tools: tools,
        systemInstruction: "You are a helpful regulatory assistant for the CLMS app. When asked about labor laws, compliance standards, or recent news affecting contractors, use Google Search to provide accurate, up-to-date information. Always cite your sources clearly.",
      }
    });

    // Extract Grounding Metadata for sources
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
      .filter((item: any) => item !== null);

    return {
      role: 'model',
      text: response.text || "I couldn't find any relevant information.",
      sources: sources,
    };

  } catch (error) {
    return {
      role: 'model',
      text: "Sorry, I encountered an error while searching for that information. Please try again.",
    };
  }
};
