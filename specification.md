# Screenshock.me

Screenshock.me is a web application where users can:
1) Type in what they are trying to focus on, like writing an essay, and what they are trying to avoid, like going on Reddit or Hacker News.
2) Configure a negative stimulus to be triggered if they do the thing they are avoiding
3) Share their laptop screen with the browser
4) See how long they have gone without triggering the negative stimulus

The frontend is React.

The backend is Django.
The backend is completely stateless. We create no database and no models.
There is no login or auth.

# FRONTEND PAGES

## HOMEPAGE AND EXPLANATION

Style: Eclectic rainbow vibe, where the rainbow isn't a gradient, but instead is a pattern.
Design should be responsive and work on both mobile and desktop. Every element should have a look that is triggered upon hover.


The hero text should be "SCREENSHOCK.me: If you get distracted, AI zaps you!"
Then, there should be the image infographic.png that is in this repository.

Explanation: 
1) Describe what you are trying to focus on
2) Describe what you might find yourself distracted by that you want to avoid
3) Set negative stimulus to be delivered when your focus strays: zap, beep, or vibrate
    (zap and vibrate require Pavlok device)
4) Share your screen (screenshock.me will ask for this like a video call)
5) Get zapped if you stray from focus!

Below this should be a text input that defaults to:
"I'm trying to stay focused on writing an essay, but I keep getting distracted by watching cat videos. I also want to stay off of Hacker News and Reddit"

Below that:
"NEGATIVE STIMULUS CONFIGURATION:"
with a dropdown: "loud beep (through your computer)", "zap (requires Pavlok device)", "loud beep (through your Pavlok device)", "vibrate (through your Pavlok device)"

Once they have selected a negative stimulus, if it is something that requires a Pavlok device, a field entry appears below to enter their Pavlok token.
Also, let's put a "?" button to the right of this box. When clicked, we open a modal that explains what a Pavlok device is and, if you have one, how to get an API token.

Below that is a "Start monitoring" button.
When you click that, we engage the browser screen APIs to get permission to record the user’s screen. Let’s make sure that this is the proper api / actually tries to record the screen so that the browser screen picker engages (entire screen, window, tab, whole desktop).
If the user fails to give us permission, let’s show an error dialog.

Below that is a X (twitter) icon and: "Follow me on X: @griffbish"

## MONITORING PAGE

The monitoring page shows "SCREENSHOCK.me: If you get distracted, AI zaps you!" large at the top.
It also shows the duration, in minutes and seconds, for which you have not strayed from focus.

There is a button "Pause monitoring" which stops the monitoring loop. When clicked, it becomes "Restart monitoring".

There is an expandable element for debugging, which shows the last 10 screenshots which have been captured and their associated detection information from the backend. Each row should have one screenshot on the left, and the backend output on the right.



# IMPLEMENTATION DETAILS

IMPORTANT: THE BACKEND IS COMPLETELY STATELESS.

When the user presses "Start Monitoring", we start. EVERY 1 SECOND, we take a screenshot of what they are doing. 
We send the backend the base64_encoded_image, the focus_description, and the pavlok_token (which may be null if the user didn't choose a Pavlok option). Make sure this loop or timeout can be stopped when the user presses the pause monitoring button.

The backend /monitor endpoint accepts these two fields and calls gemini-2.5-flash-lite-preview-06-17 to determine if the screenshot of what the user doing suggests that they have strayed focus. Let's be very specific and systematic with the prompt: how can we make sure that, given any screenshot of what a user is doing, that we can deliver the negative stimulus very reliably WHEN THEY EXPECT IT TO BE DELIVERED, and not when they don't?

For example, if they describe that they want to not go on Reddit or Youtube, only deliver negative stimulus if they are ACTUALLY on Reddit or on Youtube. Don't deliver the stimulus if you merely see reddit.com or "reddit" written somewhere. For example, they might have a icon to go to reddit on their browser. This doesn't mean they are actively using reddit. MAKE SURE THEY ARE ACTUALLY DOING THE THING THEY SAID THEY SHOULDN'T and if that's true, then return "negative_stimulus": true

On the other side of things, let's be a bit lenient with their description of what they DO want to focus on. If they say they are trying to write an essay, it's reasonable (if they don't specify any of these things to mandate negative stimulus) go on wikipedia, conduct research, etc. Be pretty lenient with those things. But when you see a clear fault of them straying into something they have described to warrant negative stimulus (or don't want to do) then jump on that to deliver them negative stimulus.

If the LLM returns negative_stimulus as true, we should immediately POST pavlok using the authorization bearer token we got in the same request (if the user selected a Pavlok option). This allows the entire backend to be stateless.
We'll also return "negative_stimulus" to the frontend (so that if the user selected a non-Pavlok option, the browser can deliver that stimulus).

## BAML

Use BAML for the prompt to interface with gemini. Here's how to use BAML:

### How to get started with BAML:
Look at baml.md to see how to set up BAML

### Example .baml file:
class Screenshot {
    img image @description("The screenshot image")
    timestamp string @description("ISO format timestamp when the screenshot was taken")
    monitor_name string @description("Name of the monitor this screenshot came from (e.g., 'Built-in Retina Display', 'Dell Monitor')")
    display_id string @description("Unique identifier for the display/monitor")
}

function QueryScreens(
    query: string,
    screens: Screenshot[] @description("Array of screenshots with their timestamps")
) -> string {
    client "google-ai/gemini-2.5-pro" // gemini-2.5-flash // gemini-2.5-flash-lite-preview-06-17

    prompt #"
        You are a screen analysis system. Your task is to analyze the provided screenshots and answer the user's query.

        Query: {{query}}

        Please analyze these screenshots:
        {% for screen in screens %}
        Screenshot from {{screen.monitor_name}} ({{screen.display_id}}) taken at {{screen.timestamp}}:
        {{ screen.img }}
        {% endfor %}

        Please provide a detailed response to the query.
        Focus on:
        1. Direct answers to the query using information from the screenshots
        2. Supporting evidence and context from specific screenshots (including timestamps and monitor names)
        3. Patterns or changes observed across screenshots over time
        4. Cross-monitor workflows or activities spanning multiple displays
        5. Any uncertainties or gaps in the information

        If no screenshots are given, return "NO_SCREENSHOTS_PROVIDED"
        If the query is not related to the screenshots, return "NO_RELEVANT_INFORMATION_FOUND_IN_SCREENSHOTS"
        If the query is not clear, return "QUERY_NOT_CLEAR"
        By default, be as concise as possible while still completely answering the query.

        {{ctx.output_format}}
    "#
} 

### Python usage of that BAML 

        # Load screen buffers and convert to BAML Image objects
        screenshots = []
        for screen in screens:
            if screen.load_buffers_to_memory():
                # image_buffers is a list of bytes objects, one per monitor
                for i, img_bytes in enumerate(screen.image_buffers):
                    # Convert bytes to base64 string
                    base64_str = base64.b64encode(img_bytes).decode('utf-8')
                    
                    # Get monitor info for this image
                    monitor_info = {}
                    if screen.monitor_metadata and i < len(screen.monitor_metadata):
                        monitor_info = screen.monitor_metadata[i]
                    
                    monitor_label = monitor_info.get('name', f'Monitor {i+1}')
                    display_id = monitor_info.get('display_id', f'unknown-{i}')
                    
                    screenshots.append({
                        "img": Image.from_base64(
                            "image/png",  # Assuming PNG format
                            base64_str
                        ),
                        "timestamp": screen.render_timestamp_for_llm(),
                        "monitor_name": monitor_label,
                        "display_id": display_id
                        # IMPORTANT: when we present the screenshots to the LLM, we ensure timestamps are in the user's local timezone
                    }) # Screens already have a time at which they were captured, so don't use the client's current timezone -- use the stored one at capture time
        
        # Send progress update
        self.send_progress(
            tool_call_id,
            message=f"Analyzing {len(screenshots)} screenshots",
            data={
                'progress': 10,
                'total': 100,
                'screen_count': len(screenshots)
            }
        )
        
        # Use gemini-2.0-flash to analyze screens
        analysis = b.QueryScreens(
            query=query,
            screens=screenshots
        )

## Further implementation details

### Pavlok api

Interface with the pavlok device with an HTTP request:

curl --request POST \
     --url https://api.pavlok.com/api/v5/stimulus/send \
     --header 'Authorization: Bearer xxxxxxxxxxxxxxxxxxxxxxxx' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "stimulus": {
    "stimulusType": "beep",
    "stimulusValue": 100
  }
}

stimulus type can be:
["zap", "beep", "vibe"]
value is 1-100

### How to deliver pavlok stimulus
In order to minimize round trip time latencies, we'll POST pavlok directly in the backend after the LLM gets back to us.


### Non-pavlok stimulus

If the user chooses beep without pavlok, then we should play a high-volume beep noise throught the browser.

### Stimulus timing

IMPORTANT: We want to make sure we never deliver more than one stimulus in 5 seconds. We cannot guarantee this given that the backend, which delivers pavlok stimulus, is stateless. BUT, we can do a great job of this on the frontend. Since we recieve "negative_stimulus" from the backend in response, we can STOP sending requests until 5 seconds has passed. The way this should work is that we don't queue up requests, instead we just don't send a given request for a capture if it occurs less than 5 seconds after we've recieved "negative_stimulus" as true from the backend.

IMPORTANT: Don't send another /monitor request until we recieve a response. 
However, we do want to account for the possibility that we may never recieve a response (if there is an error, or if the network times out). To account for this, let's make it so that we don't send another /monitor request until we recieved a response, BUT if it's been more than 5 seconds since we sent the request, then we consider that request to be dropped, and we CAN send another request.

### React notes

1) DO NOT USE useEffect()
This makes everything more complicated, and fucks up all the state.

2) SIMPLIFY AND MINIMIZE YOUR USE OF STATE WHEREVER POSSIBLE. 




# ADDTIONAL FRONTEND STYLE NOTE
Make sure everything is aesthetically pleasing, but a bit eclectic. Wherever possible, insert lucide icons, if they are appropriate.

# DEPLOYMENT AND DOCKER
Screenshock.me will be deployed as a single container. 
It will have a single Dockerfile that both builds the static files, and then serves them in the Django server.
In development, we will run the frontend server on the default port :3000
But in production, no frontend development server will be running, so we'll have to have / endpoint in the django server serve the built static files.
That way we only need to run one process in production. 
But, this means we should set API_BASE_URL to, if we are in development, use localhost with the port of the Django server. While in production, we should use the current window.location. We can't just use window.location in development, because that would send API requests to localhost:3000 rather than the port the Django server is running on.
