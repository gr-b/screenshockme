
class FocusAnalysisResult {
    negative_stimulus bool @description("Whether the user has strayed from their focus and should receive negative stimulus")
    analysis string @description("Detailed analysis of what the user is doing in the screenshot")
    confidence float @description("Confidence level of the analysis (0.0 to 1.0)")
    distraction_details string? @description("If distracted, what specific distraction was detected")
}


function AnalyzeFocus(
    screenshot: image,
    focus_description: string
) -> FocusAnalysisResult {
    client "google-ai/gemini-2.5-flash-lite-preview-06-17" // gemini-2.5-flash // gemini-2.5-flash-lite-preview-06-17
    
    prompt #"
        You are a focus monitoring AI for Screenshock.me. Your job is to determine if a user has strayed from their stated focus goals based on a screenshot of their current activity.

        USER'S FOCUS GOALS:
        {{ focus_description }}

        ANALYSIS GUIDELINES:
        1. Be VERY SPECIFIC and STRICT about when to trigger negative stimulus
        2. Only return negative_stimulus=true when the user is ACTIVELY doing something they specifically said they want to avoid
        3. Be LENIENT about activities that support their focus goals (research, reference materials, etc.)
        4. DO NOT trigger for mere presence of icons, bookmarks, or URLs - only active engagement
        
        EXAMPLES OF WHEN TO TRIGGER:
        - User said "stay off Reddit" and they are actively browsing Reddit posts/comments
        - User said "avoid YouTube" and they are watching a YouTube video
        - User said "no social media" and they are scrolling through Twitter/Instagram feeds
        - User said "stop gaming" and they are actively playing a game

        EXAMPLES OF WHEN NOT TO TRIGGER:
        - User said "stay off Reddit" but you only see a Reddit bookmark or icon
        - User said "focus on writing" and they're researching on Wikipedia (this supports writing)
        - User said "avoid YouTube" but they're watching an educational video related to their focus task
        - User has multiple tabs open but is actively working on their focus task
        - Brief glimpses of distracting content while navigating to focus-related content

        BE CONSERVATIVE: When in doubt, DO NOT trigger negative stimulus. It's better to miss a distraction than to incorrectly punish someone who is focused.

        SCREENSHOT TO ANALYZE:
        {{ screenshot }}

        {{ ctx.output_format }}
    "#
}
