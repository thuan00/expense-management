
using google sheet to manage expense

get a copy of the spreadsheet [here](https://docs.google.com/forms/d/e/1FAIpQLScXM_wWbAXoSDQFSNKY7nGTdqLZv7eG-cDSQyAi_rY6iSmnIA/viewform?usp=sf_link)

![preview](img/preview.img)

<br>



# my problem

available apps that i have seen (for example, [money lover](https://play.google.com/store/apps/details?id=com.bookmark.money)), are not suitable for me for the following reasons:

- their data entry process, either manual entry, or SMS-based, or bank account linkage, which is limited to only some banks and costs extra money
- most require in-app purchase for full features (such as data export)
- privacy and permissions "may" be an issue, i prefer keeping the data private, controllable, accessible
- they can not be extended with certain features, reports, or tailored to individual needs

my solution is to simply use google sheets (private, fully accessible data, configurable, extensible, with sheet functions and there are more as you learn about it)

and add-ons or utilities for more convenient data entry

<br>



# utilities

these utilities are based on [app script](https://developers.google.com/apps-script/overview) to extend the functionality and automation to sheets

## 1. a button to quickly add rows with default values

<!-- it helps saving the time on adding rows, which requires a series of manual operations and guestures -->

for newbies, here is [a video introducing button and app script in 5 minutes ](https://www.youtube.com/watch?v=SERvgSdWugc)

notes:
- to use the button on mobile devices, I recommend using a browser with desktop mode [as a workaround](https://stackoverflow.com/a/59026868), since buttons dont work on mobile app
- tip: on mobile chrome desktop mode, use double tap for zooming in or out, pinching doesn't work for me

check out the function `add_rows_button_on_click()` in the [code](Code.gs)


## 2. logging phone notification to google sheets

(android-only, not possible in ios)

this utility is not yet user-friendly and fairly complicated to setup so it is mostly reserved for the tech-savvy to tackle

### background info:
- notification data access is possible on only android via [its API](https://developer.android.com/reference/android/service/notification/NotificationListenerService)
- [termux:api plugin](https://github.com/termux/termux-api) wraps that API and provide a command (`termux-notification-list`) that output a list of visible notification in json
- termux:api [documentation](https://wiki.termux.com/wiki/Termux:API) does not have details about the command, but there was some [discussions](https://github.com/termux/termux-api/issues/110#issuecomment-1234087476) and the code can be seen [here](https://github.com/termux/termux-api/blob/master/app/src/main/java/com/termux/api/apis/NotificationListAPI.java)


### design:

the utility comprise of 2 components:

- one runs on the phone, using (termux + termux:api + curl command) to read visible notifications and post them to a web app
- another is the web app, using app script, receiving and processing notification data and inserting records into a sheet
    - check out the [code](Code.gs)

later work can simplify termux*+curl into a simple app


### setup steps:

1. prepare a sheet, maybe clone my sheet
2. set the web app up and running:
    - clone the web app
    - update the config:
        - identify your money app's package name (with this [guide](https://www.techmesto.com/find-android-app-package-name/))
        - write and specify a notification parsing function specific for your money app
    - run the `try_doPost()` function, by choosing that function in the dropdown menu and clicking "run"
    - allow permision via a popup
    - debug and ensure that the function works well with your notifications
    - deploy
        - as a web app
        - allow access to "anyone", so the phone termux can call it
        - copy the deployment `URL` to use in a command later (note: keep the link private to yourself and that should be fine)
3. setup the phone:
    - install f-droid apk from [f-droid.org](https://f-droid.org/) (f-droid is like google play, but for open source apps)
    - allow f-droid to install other apps' apk
    - from f-droid install termux, termux:api, termux:widget
    - allow termux:api to access notification
        - (on an android-13 pixel device) i go to settings > notifications > privacy: device & app noti
    - setup termux: open termux and run these commands:
        - `pkg upgrade`
        - `pkg install termux-api`
    - test this COMMAND to send data to the web app and see if it works
        - `termux-notification-list | curl -L --json @- URL`
    - create a shortcut script by running this command on termux:
        - `echo 'COMMAND' > ~/.shortcuts/you_name_it.sh`
    - setup a termux widget that links to that shortcut script, namely: `you_name_it.sh`, allowing you to run the script with a touchh


