import {
  ILabShell,
  ILayoutRestorer,
  IRouter,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  IFileBrowserFactory,
  FileBrowser,
  Uploader
} from '@jupyterlab/filebrowser';
import { ITranslator } from '@jupyterlab/translation';
import { addJupyterLabThemeChangeListener } from '@jupyter/web-components';
import {
  createToolbarFactory,
  IToolbarWidgetRegistry,
  setToolbar,
  Dialog,
  showDialog
} from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { FilenameSearcher, IScore } from '@jupyterlab/ui-components';
import { CommandRegistry } from '@lumino/commands';

import { DriveListModel, DriveListView, IDrive } from './drivelistmanager';
import { DriveIcon, driveBrowserIcon } from './icons';
import { Drive } from './contents';
import { getDrivesList, setListingLimit } from './requests';
import { IDriveInfo, IDrivesList } from './token';

/**
 * The command IDs used by the driveBrowser plugin.
 */
namespace CommandIDs {
  export const openDrivesDialog = 'drives:open-drives-dialog';
  export const openPath = 'drives:open-path';
  export const toggleBrowser = 'drives:toggle-main';
}

/**
 * The file browser factory ID.
 */
const FILE_BROWSER_FACTORY = 'DriveBrowser';

/**
 * The class name added to the  drive filebrowser filterbox node.
 */
const FILTERBOX_CLASS = 'jp-drive-browser-search-box';

const openDriveDialogPlugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyter-drives:widget',
  description: 'Open a dialog to select drives to be added in the filebrowser.',
  requires: [IFileBrowserFactory, ITranslator],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    factory: IFileBrowserFactory,
    translator: ITranslator
  ): void => {
    addJupyterLabThemeChangeListener();
    const { commands } = app;
    const { tracker } = factory;
    const trans = translator.load('jupyter_drives');
    const selectedDrivesModelMap = new Map<IDrive[], DriveListModel>();

    let selectedDrives: IDrive[] = [
      {
        name: 'CoconutDrive',
        url: '/coconut/url'
      }
    ];

    const availableDrives: IDrive[] = [
      {
        name: 'CoconutDrive',
        url: '/coconut/url'
      },
      {
        name: 'PearDrive',
        url: '/pear/url'
      },
      {
        name: 'StrawberryDrive',
        url: '/strawberrydrive/url'
      },
      {
        name: 'BlueberryDrive',
        url: '/blueberrydrive/url'
      },
      {
        name: '',
        url: '/mydrive/url'
      },
      {
        name: 'RaspberryDrive',
        url: '/raspberrydrive/url'
      },

      {
        name: 'PineAppleDrive',
        url: ''
      },

      { name: 'PomeloDrive', url: '/https://pomelodrive/url' },
      {
        name: 'OrangeDrive',
        url: ''
      },
      {
        name: 'TomatoDrive',
        url: ''
      },
      {
        name: '',
        url: 'superDrive/url'
      },
      {
        name: 'AvocadoDrive',
        url: ''
      }
    ];
    let model = selectedDrivesModelMap.get(selectedDrives);

    //const model = new DriveListModel(availableDrives, selectedDrives);

    commands.addCommand(CommandIDs.openDrivesDialog, {
      execute: args => {
        const widget = tracker.currentWidget;

        if (!model) {
          model = new DriveListModel(availableDrives, selectedDrives);
          selectedDrivesModelMap.set(selectedDrives, model);
        } else {
          selectedDrives = model.selectedDrives;
          selectedDrivesModelMap.set(selectedDrives, model);
        }
        if (widget) {
          if (model) {
            showDialog({
              body: new DriveListView(model),
              buttons: [Dialog.cancelButton()]
            });
          }
        }
      },

      icon: DriveIcon.bindprops({ stylesheet: 'menuItem' }),
      caption: trans.__('Add drives to filebrowser.'),
      label: trans.__('Add Drives To Filebrowser')
    });
  }
};

/**
 * The drives list provider.
 */
const drivesListProvider: JupyterFrontEndPlugin<IDriveInfo[]> = {
  id: 'jupyter-drives:drives-list',
  description: 'The drives list provider.',
  provides: IDrivesList,
  activate: async (_: JupyterFrontEnd): Promise<IDriveInfo[]> => {
    const drives: IDriveInfo[] = [];
    try {
      const response = await getDrivesList();
      for (const drive of response.data) {
        drives.push({
          name: drive.name,
          region: drive.region,
          provider: drive.provider,
          creationDate: drive.creation_date,
          mounted: drive.mounted
        });
      }
    } catch (error) {
      console.log('Failed loading available drives list, with error: ', error);
    }
    return drives;
  }
};

/**
 * The drive file browser factory provider.
 */
const driveFileBrowser: JupyterFrontEndPlugin<void> = {
  id: 'jupyter-drives:drives-file-browser',
  description: 'The drive file browser factory provider.',
  autoStart: true,
  requires: [
    IFileBrowserFactory,
    IToolbarWidgetRegistry,
    ISettingRegistry,
    ITranslator,
    IDrivesList
  ],
  optional: [
    IRouter,
    JupyterFrontEnd.ITreeResolver,
    ILabShell,
    ILayoutRestorer
  ],
  activate: async (
    app: JupyterFrontEnd,
    fileBrowserFactory: IFileBrowserFactory,
    toolbarRegistry: IToolbarWidgetRegistry,
    settingsRegistry: ISettingRegistry,
    translator: ITranslator,
    drivesList: IDriveInfo[],
    router: IRouter | null,
    tree: JupyterFrontEnd.ITreeResolver | null,
    labShell: ILabShell | null,
    restorer: ILayoutRestorer | null
  ): Promise<void> => {
    console.log(
      'JupyterLab extension jupyter-drives:drives-file-browser is activated!'
    );
    const { commands } = app;

    // create drive for drive file browser
    const drive = new Drive({
      name: 's3',
      drivesList: drivesList
    });

    app.serviceManager.contents.addDrive(drive);

    // get registered file types
    drive.getRegisteredFileTypes(app);

    // Manually restore and load the drive file browser.
    const driveBrowser = fileBrowserFactory.createFileBrowser('drivebrowser', {
      auto: false,
      restore: false,
      driveName: drive.name
    });

    // Set attributes when adding the browser to the UI
    driveBrowser.node.setAttribute('role', 'region');
    driveBrowser.node.setAttribute('aria-label', 'Drive Browser Section');
    driveBrowser.title.icon = driveBrowserIcon;
    driveBrowser.title.caption = 'Drive File Browser';
    driveBrowser.id = 'Drive-File-Browser';

    void Private.restoreBrowser(driveBrowser, commands, router, tree, labShell);

    app.shell.add(driveBrowser, 'left', { rank: 102, type: 'File Browser' });
    if (restorer) {
      restorer.add(driveBrowser, 'drive-file-browser');
    }

    toolbarRegistry.addFactory(
      FILE_BROWSER_FACTORY,
      'uploader',
      (fileBrowser: FileBrowser) =>
        new Uploader({ model: fileBrowser.model, translator })
    );

    toolbarRegistry.addFactory(
      FILE_BROWSER_FACTORY,
      'file-name-searcher',
      (fileBrowser: FileBrowser) => {
        const searcher = FilenameSearcher({
          updateFilter: (
            filterFn: (item: string) => Partial<IScore> | null,
            query?: string
          ) => {
            fileBrowser.model.setFilter(value => {
              return filterFn(value.name.toLowerCase());
            });
          },
          useFuzzyFilter: true,
          placeholder: 'Filter files by names',
          forceRefresh: true
        });
        searcher.addClass(FILTERBOX_CLASS);
        return searcher;
      }
    );

    // connect the filebrowser toolbar to the settings registry for the plugin
    setToolbar(
      driveBrowser,
      createToolbarFactory(
        toolbarRegistry,
        settingsRegistry,
        FILE_BROWSER_FACTORY,
        driveFileBrowser.id,
        translator
      )
    );

    /**
     * Load the settings for this extension
     *
     * @param setting Extension settings
     */
    function loadSetting(setting: ISettingRegistry.ISettings): void {
      // Read the settings and convert to the correct type
      const maxFilesListed = setting.get('maxFilesListed').composite as number;
      // Set new limit.
      setListingLimit(maxFilesListed);
    }

    // Wait for the application to be restored and
    // for the settings for this plugin to be loaded
    Promise.all([app.restored, settingsRegistry.load(driveFileBrowser.id)])
      .then(([, setting]) => {
        // Read the settings
        loadSetting(setting);

        // Listen for your plugin setting changes using Signal
        setting.changed.connect(loadSetting);
      })
      .catch(reason => {
        console.error(
          `Something went wrong when reading the settings.\n${reason}`
        );
      });
  }
};

const plugins: JupyterFrontEndPlugin<any>[] = [
  driveFileBrowser,
  drivesListProvider,
  openDriveDialogPlugin
];
export default plugins;

namespace Private {
  /**
   * Restores file browser state and overrides state if tree resolver resolves.
   */
  export async function restoreBrowser(
    browser: FileBrowser,
    commands: CommandRegistry,
    router: IRouter | null,
    tree: JupyterFrontEnd.ITreeResolver | null,
    labShell: ILabShell | null
  ): Promise<void> {
    const restoring = 'jp-mod-restoring';

    browser.addClass(restoring);

    if (!router) {
      await browser.model.restore(browser.id);
      await browser.model.refresh();
      browser.removeClass(restoring);
      return;
    }

    const listener = async () => {
      router.routed.disconnect(listener);

      const paths = await tree?.paths;
      if (paths?.file || paths?.browser) {
        // Restore the model without populating it.
        await browser.model.restore(browser.id, false);
        if (paths.file) {
          await commands.execute(CommandIDs.openPath, {
            path: paths.file,
            dontShowBrowser: true
          });
        }
        if (paths.browser) {
          await commands.execute(CommandIDs.openPath, {
            path: paths.browser,
            dontShowBrowser: true
          });
        }
      } else {
        await browser.model.restore(browser.id);
        await browser.model.refresh();
      }
      browser.removeClass(restoring);

      if (labShell?.isEmpty('main')) {
        void commands.execute('launcher:create');
      }
    };
    router.routed.connect(listener);
  }
}
