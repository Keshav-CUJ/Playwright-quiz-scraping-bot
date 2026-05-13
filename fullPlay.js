import { chromium } from 'playwright';

const CONFIG = {
    selectors: {
        subjectCard: '#__next > div.css-19fdje3-Container-Container.e1kplr10 > div.css-1xgbxzf-AppContainer-AppContainer.e1kplr12 > div.css-1ech8wl-Content-Content.e1kplr13 > div.css-15qey91-Container.ef5yl1c0 > div:nth-child(4) > div:nth-child(2) > div',     // Selects the subject
        subject: 'Aptitude',
        topicWrapper: '.css-ce5inc-ConceptWrapper.eqmcj50',
        startBtn: '#DrawerPaper > div.css-px1pj3-FooterContainer.eozd4c90 > button',
        // skipBtn: ".css-gjrbmu-StyledButton.e1wp3nh0", // The "Skip" button
        skipBtn: 'button:has-text("Skip")',
        dontUnderstand: ".css-13n8k7n-P1.e5hgzks0", // The "Didn't understand" checkbox/button
        nextBtn: ".css-5ljul0-StyledButton.e1wp3nh0",
        finish: ".css-5ljul0-StyledButton.e1wp3nh0",
        done: 'button:has-text("Done")',
        // done: "body > div.MuiDialog-root.css-1txoobq-StyledDialog.ec3puej0 > div.MuiDialog-container.MuiDialog-scrollPaper > div > div > div.css-88dz0w-ActionContainer.e56imdo3 > button",
        contentArea: "#__next > div.css-1p16hgs-StyledAppContainer.e16n95tl0 > div.css-1jmrjzf-PracticeContainer.ep8acd90 > div.css-k0qoiq-QuestionView.ep8acd91 > div.css-3xs9ml-QuestionSolutionWrapper.ep8acd92 > div.MuiPaper-root.css-1hqx6y0-Paper-SolutionContainer.e1hv2d2e0.MuiPaper-elevation1.MuiPaper-rounded",
        noOfTopics: 2,
        question: "#__next > div.css-1p16hgs-StyledAppContainer.e16n95tl0 > div.css-1jmrjzf-PracticeContainer.ep8acd90 > div.css-k0qoiq-QuestionView.ep8acd91 > div.css-3xs9ml-QuestionSolutionWrapper.ep8acd92 > div"
    }
};


async function buildTopicMap(page, topicCount) {

    const topicMap = new Map();
    const parentSelector = '#DrawerPaper > div.css-ce5inc-ConceptWrapper.eqmcj50';

    console.log(`Extracting ${topicCount} topics...`);

    for (let i = 1; i <= topicCount; i = i + 2) {
        try {
            // Note: If there are <hr> tags between divs, the nth-child logic 
            // might need to skip indices. If every row is a child, we use i.
            // If the structure is Div, HR, Div, HR... we use (2*i - 1).
            // Based on your previous HTML, the topics are direct children.

            const rowSelector = `${parentSelector} > div:nth-child(${i})`;

            // 1. Get Topic Name
            const nameSelector = `${rowSelector} > div.css-1ofgiwi-InfoWrapper.e6xksjz2 > div > h5`;
            const topicName = await page.locator(nameSelector).innerText();

            // 2. Get Question Count
            const pSelector = `${rowSelector} > div.css-1ofgiwi-InfoWrapper.e6xksjz2 > div > p`;
            const questionText = await page.locator(pSelector).innerText();
            const qCount = parseInt(questionText.match(/\d+/)[0], 10);

            // 3. Get Checkbox Value
            const inputSelector = `${rowSelector} > div.e14anz5u1.css-xmhlbc-CheckboxWrapper-StyledTooltip.e6xksjz4 > span > span > input`;
            const checkboxValue = await page.locator(inputSelector).getAttribute('value');

            if (topicName && checkboxValue) {
                topicMap.set(topicName.trim(), {
                    totalQuestions: qCount,
                    checkboxSelector: `input[value="${checkboxValue}"]`,
                    captured: 0
                });
                console.log(`Mapped: ${topicName} (${qCount} Qs)`);
            }

        } catch (err) {
            console.error(`Could not extract topic at index ${i}. The nth-child might be skipped by a divider.`);
        }
    }

    return topicMap;

}


async function resetAllCheckboxes(page) {
    // 1. Target the 'Select all' container
    const selectAllContainer = page.locator('.css-1rgd5yg-CheckBoxContainer');

    // 2. Target the specific checkbox span within that container
    const checkboxSpan = selectAllContainer.locator('span.MuiCheckbox-root');

    // 3. Check if it is currently checked
    // MUI uses the 'Mui-checked' class to visually and functionally indicate state
    const isChecked = await checkboxSpan.evaluate(el => el.classList.contains('Mui-checked'));

    if (isChecked) {
        console.log("Master 'Select all' is active. Disabling now...");
        // We click the span (or the input) to toggle it off
        await checkboxSpan.click();

        // Optional: wait a moment for React to update the state of all child checkboxes
        await page.waitForTimeout(500);
    } else {
        console.log("Master 'Select all' is already disabled. Proceeding...");
    }
}


async function setQuestionCount(page, targetCount) {
    const container = page.locator('.css-7svani-QuestionActionWrapper');
    const textElement = container.locator('p.css-tko6px-P1-QuestionInfo');
    const plusButton = container.locator('img[alt="increase"]');

    let currentText = await textElement.textContent(); // e.g., "10 questions"
    let currentCount = parseInt(currentText.match(/\d+/)[0]);

    console.log(`Current pagination: ${currentCount}. Aiming for ${targetCount}.`);

    while (currentCount < targetCount) {
        // Click the plus button container (the parent div of the img is usually more reliable)
        await plusButton.click();

        // Give React a tiny moment to update the state and DOM text
        await page.waitForTimeout(100);

        currentText = await textElement.textContent();
        currentCount = parseInt(currentText.match(/\d+/)[0]);

        // Safety break to prevent infinite loops if the UI caps at a certain number
        if (currentCount >= 100) break;
    }

    console.log(`Pagination successfully set to: ${currentCount}`);
}


function getCeilPagination(count) {
    if (count >= 30) return 30;
    return count
}

(async () => {
    // Connect to your open Chrome tab
    const userDataDir = 'C:\\Users\\Uname\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1';

    const browser = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Point to your actual Chrome
    });

    const page = browser.pages()[0];
    await page.goto('https://u******y.com/goal/gate-csit-dsai-interview-preparation/NVLIA/practice');
    await page.click(CONFIG.selectors.subjectCard);


    //Build the Topic Map
    await page.waitForSelector(CONFIG.selectors.topicWrapper);
    const topicMap = await buildTopicMap(page, 2 * CONFIG.selectors.noOfTopics);
    console.log(topicMap);
    // return topicMap;


    //Process each topic from the Map
    for (let [topicName, stats] of topicMap) {
        console.log(`Starting Topic: ${topicName} | Target: ${stats.totalQuestions}`);
        if (topicName === 'Verbal Ability') continue;
        if (stats.totalQuestions < 5) continue;

        while (stats.captured < stats.totalQuestions) {
            // Return to selection page if we are coming back from a quiz session
            if (page.url() !== 'https://u****y.com/goal/gate-csit-dsai-interview-preparation/NVLIA/practice') {
                await page.goto('https://u****y.com/goal/gate-csit-dsai-interview-preparation/NVLIA/practice');
                await page.waitForSelector(CONFIG.selectors.subjectCard);
            }

            await page.click(CONFIG.selectors.subjectCard, { force: true });

            await page.waitForSelector(CONFIG.selectors.topicWrapper);
            //Clean State
            await resetAllCheckboxes(page);

            //Select the specific topic
            await page.locator(stats.checkboxSelector).check({ force: true });

            const targetPagination = getCeilPagination(stats.totalQuestions);

            if (targetPagination < 5) continue;
            //Set Pagination
            await setQuestionCount(page, targetPagination);

            const startBtn = page.locator('button:has-text("Start practice")');
            await page.evaluate(() => {
                const drawer = document.querySelector('#DrawerPaper');
                if (drawer) {
                    drawer.scrollTo(0, drawer.scrollHeight);
                }
            });
            
            //Start Quiz
            await startBtn.hover();
            await startBtn.click();
            // Wait for the URL to change to the prsactice/quiz route
            await page.waitForLoadState('networkidle');


            for (let i = 1; i <= targetPagination; i++) {
                console.log(`[${topicName}] Working on Question ${stats.captured + 1}...`);
                // if(stats.captured === stats.totalQuestions) continue;

                try {

                    await page.waitForTimeout(2000);
                    stats.captured++;
                    await page.addStyleTag({ content: `[class*="FooterContainer"] { display: none !important; }` });
                    const question = page.locator(CONFIG.selectors.question);

                    await question.screenshot({
                        path: `./${CONFIG.selectors.subject}/${topicName}/question/${stats.captured}.png`,
                        // fullPage: true
                    });

                    await page.addStyleTag({ content: `[class*="FooterContainer"] { display: flex !important; }` });
                    // await page.waitForTimeout(1000);

                    //Click Skip to bypass the question
                    await page.click(CONFIG.selectors.skipBtn);

                    //Click "Didn't understand" (This often triggers the solution in React apps)
                    await page.click(CONFIG.selectors.dontUnderstand);
                    await page.waitForTimeout(2000);
                    const container = page.locator(CONFIG.selectors.contentArea);
                   
                   
                    // Generate filename using the Topic Name and Global count
                    await page.addStyleTag({ content: `[class*="HeaderContainer"] { display: none !important; }` });
                    await page.addStyleTag({ content: `[class*="FooterContainer"] { display: none !important; }` });
                    await container.screenshot({
                        path: `./${CONFIG.selectors.subject}/${topicName}/answer/${stats.captured}.png`,
                        // fullPage: true
                    });

                    await page.addStyleTag({ content: `[class*="FooterContainer"] { display: flex !important; }` });
                    await page.addStyleTag({ content: `[class*="HeaderContainer"] { display: flex !important; }` });
                    
                    //Move to next question
                    if (i < targetPagination) await page.click(CONFIG.selectors.nextBtn);

                } catch (err) {
                    console.error(`Error on ${topicName} at question count ${stats.captured}:`, err);
                    break; // Exit this session loop and go back to dashboard
                }
            }

            console.log(`Session finished. Total captured for ${topicName}: ${stats.captured}`);
            await page.click(CONFIG.selectors.finish);
            const doneBtn = page.locator(CONFIG.selectors.done);
            await doneBtn.waitFor({ state: 'visible', timeout: 10000 });

            // 3. Use a small constant wait to allow the MUI "fade" animation to end
            await page.waitForTimeout(1000);

            // 4. Force the click
            // Sometimes the button is 'covered' by the dialog transition layer
            await doneBtn.click({ force: true });

            console.log("Clicked Done button successfully.");
            // await page.waitForLoadState('networkidle');
        }
        console.log(`Finished all questions for: ${topicName}`);
        await page.waitForLoadState('networkidle');
        await page.reload();

    }

})();