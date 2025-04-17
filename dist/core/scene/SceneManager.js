export class SceneManager {
    constructor() {
        this.currentScene = null;
        this.projectData = null;
    }
    loadProject(project) {
        this.projectData = project;
        this.currentScene = null; // Reset current scene when loading a new project
        console.log('Project data loaded into SceneManager.');
    }
    loadScene(sceneName) {
        if (!this.projectData) {
            console.error('Cannot load scene: Project data not loaded.');
            return false;
        }
        const scene = this.projectData.scenes[sceneName];
        if (scene) {
            this.currentScene = scene;
            console.log(`Scene "${sceneName}" loaded.`);
            // Typically, ObjectManager would be notified here to create objects for the scene
            return true;
        }
        else {
            console.error(`Scene "${sceneName}" not found in project data.`);
            this.currentScene = null;
            return false;
        }
    }
    getCurrentScene() {
        return this.currentScene;
    }
}
