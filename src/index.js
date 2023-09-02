const { parse } = require("node-html-parser");
const hash = require("./utils/hash.js");
const fetch_html = require("./utils/fetch_html.js");
const washText = require("./utils/washText.js");
const getSelectorWithText = require("./utils/getSelectorWithText.js");
const fs = require("node:fs/promises");

const world_of_work_url = "https://www.myworldofwork.co.uk";
const job_categories_uri = "my-career-options/job-categories";

const store = {
    skills: {}, 
    categories: {},
    job_profiles: {},
}

function parse_skills(document) {
  const skills_block = document.querySelector("#skills");
  const skills = skills_block?.querySelector("#related-skills")
    ?.parentNode
    ?.childNodes
    ?.filter(el => el.tagName === 'UL')?.[0]
    ?.childNodes
    ?.map(el => el.innerText)
    ?.filter(text => text.replaceAll("\n", "").trim().length > 0);
  
  if (skills.length) {
    for (let i = 0; i < skills.length; i++) {
      const skill = skills[i];
      const skill_hash = hash(skill);
      if (!store["skills"][skill_hash]) {
        store["skills"][skill_hash] = {
          name: skill,
        };
      }
      skills[i] = skill_hash;
    }
  }

  return skills
}

async function parse_categories() {
  const document = parse(await fetch_html(`${world_of_work_url}/${job_categories_uri}`));
  const job_categories = document.querySelectorAll(".job-profile-group");
  if (job_categories.length <= 0)
    throw new Error("Couldn't found job categories!");

  const job_profiles_links = {};
  for (const job_category of job_categories) {
    const inner = job_category.querySelector(".inner");
    const job_category_title = inner.querySelector("h2")?.innerText;
    if (!job_category_title) 
      throw new Error("Couldn't parse category title:", job_category);
    
    const job_category_hash = hash(job_category_title);
    store["categories"][job_category_hash] = {
      "name": job_category_title
    };
    const job_profiles = inner.querySelectorAll(".job-profile");
    job_profiles_links[job_category_hash] = [];
    for (const jb of job_profiles) {
      const a = jb.querySelector("a");
      const url = a.getAttribute("href");
      const jb_hash = hash(washText(a?.innerText));
      store["job_profiles"][jb_hash] = null;
      console.log(jb_hash, washText(a?.innerText))
      if (!url)
        throw new Error("Couldn't parse link of job profile", jb);
      
      job_profiles_links[job_category_hash].push(url);
    }
  }

  return job_profiles_links;
}

async function parse_profiles(job_profiles_links) {
  for (const category_hash of Object.keys(job_profiles_links)) {
    const uris = job_profiles_links[category_hash];
    for (const uri of uris) {
      const url = `${world_of_work_url}${uri}`;
      console.log('parsing', url)
      const document = parse(
        await fetch_html(url), 
        { 
          parseNoneClosedTags: true, 
        }
      );
      const job_description = {
        "category_id": null,
        "url": null,
        "job_name": null,
        "alternative_titles": null,
        "pathways": null,
        "salary": {
          "entry_level": null,
          "experienced": null,
          "average": null,
        },
        "description": null,
        "working_conditions": {
            "hours": null,
            "environment": null,
            "travel": null,
        },
        "employment_status": {
            "full_time": null,
            "part_time": null,
            "self_employed": null,
        },
        "top_skills": null,
        "getting_in": {
            "qualifications": null,
            "useful_subjects": null,
            "helpful_to_have": null,
        },
        "related_careers": null,
        "explore_more": {
            "links": null,
        }
      };

      const header_title = document.querySelector("div.article-header__title-content");
      const job_title_name = washText(header_title.querySelector("h1").innerText);
      const job_id = hash(job_title_name);
      const job_title_alternative = header_title.querySelectorAll("span.field-item").map(el => washText(el.innerText));
      const job_subtitle = document.querySelector("div.article-header__role-list");
      const pathways_urls = Array.from(
        job_subtitle.querySelectorAll("a")
      )
        .filter(e => e.getAttribute("href")
        .includes("pathway"))
        .map(e => `${world_of_work_url}${e.getAttribute("href")}`);

      let salaries = document.querySelectorAll(".career-outlook-block__salary-data");
      if (!salaries.length) {
        salaries = document.querySelector("#job-average-salary-range");
      }
      const salary_entry_level = washText(salaries?.[0]?.childNodes?.[1]?.querySelector("#job-starter-salary")?.innerText);
      const salary_experienced = washText(salaries?.[1]?.childNodes?.[1]?.querySelector("#job-experienced-salary")?.innerText);
      const salary_average = washText(salaries?.innerText);

      const description = washText(document.querySelector(".field-type-text-long").innerText);

      const hours = washText(
        document
        .querySelectorAll(".field-collection-item-field-working-conditions")?.[0]?.childNodes[3]?.innerText
      );
      const environment = washText(
        document
        .querySelectorAll(".field-collection-item-field-working-conditions")?.[1]?.childNodes[3]?.innerText
      );
      const travel = washText(
        document
        .querySelectorAll(".field-collection-item-field-working-conditions")?.[2]?.childNodes[3]?.innerText
      );

      const employment_statuses = Array.from(
        document
          ?.querySelector("#job-employment-status")
          ?.querySelector("#employment-status")
          ?.childNodes || []
      )?.filter(el => el.childNodes.length);
      const full_time = washText(employment_statuses[0]?.childNodes?.[3]?.innerText);
      const part_time = washText(employment_statuses[1]?.childNodes?.[3]?.innerText);
      const self_employed = washText(employment_statuses[2]?.childNodes?.[3]?.innerText);

      const skills = parse_skills(document);
    
      const qualifications = washText(
        Array.from(
          getSelectorWithText(document, "h3", "Qualifications")
            ?.parentNode
            ?.childNodes
        )
          ?.filter(node => node.tagName !== "H3")
          ?.map(node => node.innerText)
          ?.join("")
      );
      const useful_subjects = Array.from(
          getSelectorWithText(document, "h3", "Useful subjects")
            ?.parentNode
            ?.childNodes || []
        )
          ?.filter(node => node.tagName !== "H3")
          ?.map(node => node.innerText)
          ?.filter(text => text.replaceAll("\n", "").trim().length > 0)
          ?.join()
          ?.split("\n")
          ?.filter(text => text.length > 0);
      const helpful_to_have = washText(
        Array.from(
          getSelectorWithText(document, "h3", "Helpful to have")
            ?.parentNode
            ?.childNodes || []
        )
          ?.filter(node => node.tagName !== "H3")
          ?.map(node => node.innerText)
          ?.join("")
      );

      const related_careers_block = document.querySelector(".job-profile-related-jobs");
      const related_careers = related_careers_block.querySelectorAll(".button").map(btn => washText(btn.innerText));
      for (let i = 0; i < related_careers.length; i++) {
        const rc = related_careers[i]
        const hash_rc = hash(rc);
        if (typeof store["job_profiles"][hash_rc] === "undefined") {
          console.log("HASH", hash_rc, rc);
          throw new Error(`Unkown related career: ${rc}!`);
        }
        related_careers[i] = hash_rc;
      }

      const more_information_urls = document?.querySelector("#more-information")
        ?.querySelector(".content")?.childNodes.map(content => ({
          title: washText(content.innerText),
          url: content.getAttribute("href")
        }));
      
      job_description.category_id = category_hash;
      job_description.url = url;
      job_description.job_name = job_title_name;
      job_description.alternative_titles = job_title_alternative;
      job_description.pathways = pathways_urls;
      job_description.salary = {
        "entry_level": salary_entry_level,
        "experienced": salary_experienced,
        "average": salary_average,
      }
      job_description.description = description;
      job_description.working_conditions = {
        hours,
        environment,
        travel,
      };
      job_description.employment_status = {
        full_time,
        part_time,
        self_employed,
      };
      job_description.top_skills = skills;
      job_description.getting_in = {
        qualifications,
        useful_subjects,
        helpful_to_have,
      };
      job_description.related_careers = related_careers;
      job_description.explore_more = more_information_urls;

      store["job_profiles"][job_id] = job_description;
    }
  }
}

async function main() {
  try {
    const job_profiles_links = await parse_categories();
    await parse_profiles(job_profiles_links);
    console.log('Done!');
  } catch (err) {
    console.error(err);
  };
  await fs.writeFile("store/output.json", JSON.stringify(store, null, '\t'));
}

main()
