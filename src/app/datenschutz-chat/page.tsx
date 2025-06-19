export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Privacy Policy - Chat Application
        </h1>
        
        <div className="glass rounded-xl p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">Supplement to Main Privacy Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              This privacy policy supplements the general privacy policy of lukeschroeter.de 
              with specific information about data processing in the chat application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">1. Types of Data Processed</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              The following personal data is processed in the chat application:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>User Account Data:</strong> Email address, username (when registering via Supabase Auth)</li>
              <li><strong>Chat Content:</strong> All messages you enter in the application</li>
              <li><strong>Conversation History:</strong> Saved chat sessions with timestamps</li>
              <li><strong>API Configuration:</strong> Your OpenRouter API key (stored encrypted)</li>
              <li><strong>File Uploads:</strong> Uploaded attachments and their metadata</li>
              <li><strong>Usage Statistics:</strong> Information about models used and frequency of use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">2. Purpose of Data Processing</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Data processing serves the following purposes:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Providing chat functionality</li>
              <li>Storage and recovery of conversation histories</li>
              <li>Authentication and user management</li>
              <li>Improving application performance</li>
              <li>Technical maintenance and troubleshooting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">3. Legal Basis</h2>
            <p className="text-gray-300 leading-relaxed">
              Processing is based on Art. 6(1)(b) GDPR (contract performance) 
              and Art. 6(1)(f) GDPR (legitimate interest in providing and improving 
              the application).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">4. Data Storage and Security</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-purple-200 mb-2">Supabase (Database)</h3>
                <p className="text-gray-300 leading-relaxed mb-2">
                  All user data is stored in a Supabase database:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                  <li>Server location: EU (GDPR compliant)</li>
                  <li>Encryption: Data is transmitted and stored encrypted</li>
                  <li>Access control: Strict authentication and authorization</li>
                  <li>API keys are additionally encrypted in storage</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-purple-200 mb-2">OpenRouter (AI Models)</h3>
                <p className="text-gray-300 leading-relaxed mb-2">
                  Chat content is transmitted to OpenRouter for processing:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                  <li>Transmission occurs via your own API key</li>
                  <li>OpenRouter stores requests according to their privacy policy</li>
                  <li>No permanent storage of chat content at OpenRouter</li>
                  <li>More information: <a href="https://openrouter.ai/privacy" className="text-purple-400 hover:text-purple-300">OpenRouter Privacy Policy</a></li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">5. Storage Duration</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Storage duration depends on the purpose of data processing:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>Chat History:</strong> Until deletion by user or account deletion</li>
              <li><strong>User Account:</strong> Until account deletion by user</li>
              <li><strong>API Keys:</strong> Until change or account deletion</li>
              <li><strong>File Uploads:</strong> Until manual deletion or account deletion</li>
              <li><strong>Log Data:</strong> Maximum 30 days for technical purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">6. Cookies and Local Storage</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              The application uses the following cookies and local storage:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>Authentication Cookies:</strong> For login (Supabase Auth)</li>
              <li><strong>Session Cookies:</strong> For maintaining the session</li>
              <li><strong>LocalStorage:</strong> For UI settings and temporary data</li>
              <li><strong>Functional Cookies:</strong> For proper application functionality</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-3">
              These cookies are required for application functionality and cannot be disabled.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">7. Your Rights</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              In addition to the rights mentioned in the main privacy policy, you have the following 
              specific options:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>Data Export:</strong> Export all your chat histories via the application</li>
              <li><strong>Selective Deletion:</strong> Delete individual conversations</li>
              <li><strong>Account Deletion:</strong> Complete deletion of all data via settings</li>
              <li><strong>API Key Management:</strong> Change or remove at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">8. Data Transfer to Third Countries</h2>
            <p className="text-gray-300 leading-relaxed">
              When using AI models via OpenRouter, data may be transferred to third countries, 
              depending on the selected model provider. This occurs exclusively via your own API key 
              and under your direct control. Information about the respective model providers can be found 
              in the OpenRouter documentation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">9. Privacy for Minors</h2>
            <p className="text-gray-300 leading-relaxed">
              The application is intended for persons aged 16 and older. Persons under 16 may only use the 
              application with consent from their legal guardians. Upon knowledge of data processing of minors 
              without appropriate consent, the data will be deleted immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">10. Contact for Privacy Questions</h2>
            <p className="text-gray-300 leading-relaxed">
              For questions about privacy in the chat application, please contact:
            </p>
            <div className="mt-3 p-4 bg-gray-800 rounded-lg">
              <p className="text-gray-300">
                <strong>Luke Schröter</strong><br />
                Email: lukeschroeter05@gmail.com<br />
                Subject: "Chat Application Privacy"
              </p>
            </div>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-600">
            <p className="text-sm text-gray-400">
              Last updated: June 2025<br />
              This privacy policy supplements the general privacy policy of lukeschroeter.de
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 