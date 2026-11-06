pipeline {
    agent { label 'maven-docker-agent' }

    triggers {
        githubPush()
    }

    options {
        timestamps()
        skipDefaultCheckout(true)
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code from SCM'
                checkout scm
            }
        }

        stage('Build and Test') {
            steps {
                echo 'Resolving Maven dependencies, compiling, and running tests'
                sh 'mvn --batch-mode --no-transfer-progress clean verify'
            }
        }

        stage('Compiler Warnings') {
            steps {
                echo 'Collecting Maven compiler warnings for the Jenkins build report'
                recordIssues tools: [mavenConsole()]
            }
        }

        stage('SonarQube Analysis') {
            steps {
                echo 'Analyzing source code with SonarQube'
                withSonarQubeEnv('Local SonarQube') {
                    sh 'mvn --batch-mode --no-transfer-progress org.sonarsource.scanner.maven:sonar-maven-plugin:5.0.0.4638:sonar -Dsonar.projectKey=product-catalog'
                }
            }
        }

        stage('Quality Gate') {
            steps {
                echo 'Waiting for the SonarQube quality gate result'
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }

    post {
        success {
            echo 'Build and test pipeline completed successfully'
        }
        failure {
            echo 'Build and test pipeline failed; review the stage output above'
        }
    }
}
