export interface EmailPayload {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string;
}

export interface EmailProvider {
    sendEmail(payload: EmailPayload): Promise<void>;
}
