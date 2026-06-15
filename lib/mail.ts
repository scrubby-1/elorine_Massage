import nodemailer from 'nodemailer'

interface MailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendMail(options: MailOptions) {
  try {
    // Als credentials niet zijn ingesteld, skip het verzenden
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.log('Mail credentials niet ingesteld, e-mail wordt overgeslagen')
      return { success: false, error: 'Credentials niet ingesteld' }
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    })

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('E-mail verzonden:', info.messageId)
    return { success: true }
  } catch (error) {
    console.error('Fout bij verzenden e-mail:', error)
    return { success: false, error }
  }
}
