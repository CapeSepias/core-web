#!/bin/bash

TEST_RESULTS="test-results-core-web"
GITHUB="github.com"
GITHACK="raw.githack.com"
GITHUB_TEST_RESULTS_PATH="DotCMS/${TEST_RESULTS}"
DOT_CICD_TARGET="core-web"
GITHUB_USER="dotcmsbuild"
CURRENT_BRANCH=${GITHUB_REF##*/}
DOT_CICD_PATH="./dotcicd"
OUTPUT_FOLDER="karma_html"
export GITHUB_TEST_RESULTS_HOST_PATH="${GITHUB}/${GITHUB_TEST_RESULTS_PATH}"
export GITHUB_TEST_RESULTS_URL="https://${GITHUB_TEST_RESULTS_HOST_PATH}"
export GITHACK_TEST_RESULTS_URL="https://${GITHACK}/${GITHUB_TEST_RESULTS_PATH}"
export GITHUB_TEST_RESULTS_REPO="${GITHUB_TEST_RESULTS_URL}.git"
export GITHUB_TEST_RESULTS_BROWSE_URL="${GITHACK_TEST_RESULTS_URL}/${CURRENT_BRANCH}/projects/${DOT_CICD_TARGET}/${GITHUB_SHA::8}"
export GITHUB_TEST_RESULTS_REMOTE="https://${GH_TOKEN}@${GITHUB_TEST_RESULTS_HOST_PATH}"
export GITHUB_TEST_RESULTS_REMOTE_REPO="https://${GH_TOKEN}@${GITHUB_TEST_RESULTS_HOST_PATH}.git"

function existsOrCreateAndSwitch {
  local results=${1}
  if [[ ! -d $results ]]; then
    mkdir -p $results
  fi

  cd $results
}

function gitConfig {
  git config --global user.email "${GITHUB_USER}@dotcms.com"
  git config --global user.name "${GITHUB_USER}"
  git config -l | grep user
}

function addResults {
  local results=${1}
  if [[ -z "$results" ]]; then
    echo "Cannot add results since its empty, ignoring"
    exit 1
  fi

  local targetFolder=${results}
  mkdir -p ${targetFolder}
  echo "Adding test results to: ${targetFolder}"
  echo "output: ${OUTPUT_FOLDER}/* target:${targetFolder}"
  cp -r "${GITHUB_WORKSPACE}/${OUTPUT_FOLDER}/." ${targetFolder}
}


function persistResults {
  TEST_RESULTS_PATH=${DOT_CICD_PATH}/${TEST_RESULTS}
  gitConfig
  
  if [[ ! -d dotcicd/test-results ]]; then
    echo "Cloning ${GITHUB_TEST_RESULTS_REPO} to ${TEST_RESULTS_PATH}"
    git clone ${GITHUB_TEST_RESULTS_REPO} ${TEST_RESULTS_PATH}
  fi
  
  existsOrCreateAndSwitch ${TEST_RESULTS_PATH}/projects/${DOT_CICD_TARGET}
  
  git fetch --all

  remoteBranch=$(git ls-remote --heads ${GITHUB_TEST_RESULTS_REMOTE_REPO} ${CURRENT_BRANCH} | wc -l | tr -d '[:space:]')

  if [[ ${CURRENT_BRANCH} != "master" && ${CURRENT_BRANCH} != "merge" ]]; then
    if [[ ${remoteBranch} == 1 ]]; then
      echo "git checkout -b ${CURRENT_BRANCH} --track origin/${CURRENT_BRANCH}"
      git checkout -b ${CURRENT_BRANCH} --track origin/${CURRENT_BRANCH}
    else
      echo "git checkout -b ${CURRENT_BRANCH}"
      git checkout -b ${CURRENT_BRANCH}
    fi
  fi
  
  if [[ $? != 0 ]]; then
    echo "Error checking out branch '${CURRENT_BRANCH}', continuing with master"
    git pull origin master
  else
    git branch
    if [[ ${remoteBranch} == 1 ]]; then
      echo "git pull origin ${CURRENT_BRANCH}"
      git pull origin ${CURRENT_BRANCH}
    fi
  fi

  addResults ./${GITHUB_SHA::8}
  git add .
  git commit -m "Adding tests results for ${GITHUB_SHA::8} from ${CURRENT_BRANCH}"
  git push ${GITHUB_TEST_RESULTS_REMOTE} 
  git status
}

function logResults {
  echo "${GITHUB_TEST_RESULTS_BROWSE_URL}/report.html"
}