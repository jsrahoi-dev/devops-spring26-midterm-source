## [1.4.3](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/compare/v1.4.2...v1.4.3) (2026-03-09)


### Bug Fixes

* add database initialization to create tables on startup ([e9ac706](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/e9ac706940120b80e4011f55ca78456c74d4552a))

## [1.4.2](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/compare/v1.4.1...v1.4.2) (2026-03-08)


### Bug Fixes

* remove unused expect import from test setup ([6619afc](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/6619afcf9959b046e73a8c9ffdcff14dedfd4efc))

## [1.4.1](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/compare/v1.4.0...v1.4.1) (2026-03-08)


### Bug Fixes

* include hex field in classification submission ([a5ef4ca](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/a5ef4cab552fda60d1b65ec94c741328d8cc2b52))

# [1.4.0](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/compare/v1.3.0...v1.4.0) (2026-03-08)


### Bug Fixes

* add automated validation and error checks to migration ([8ef512e](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/8ef512e5a81ea8be4e2e9796837aef724692850e))
* add hex field to mostClassifiedColor in global stats ([f6aad32](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/f6aad324f47be9b5fd48578f1f530e7de45bfff7))
* add type and format validation to responses endpoint ([3bd669a](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/3bd669a98ec38344f44ac3fbe3adb1c4e63f702f))
* add validation and document N+1 pattern in visualize endpoint ([9cb2162](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/9cb21629dcedc98e19ddf7c83047a0f6054df9f0))
* improve migration safety and rollback script ([add7fb7](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/add7fb7024b3ced95a68e28e9fb3be912689f0c8))
* include hex in GROUP BY clause for mostClassifiedColor ([9af34e5](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/9af34e592ce7d07df144dfcc6f41329e9cecba89))
* trust nginx proxy for session persistence ([5e2b49e](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/5e2b49e29061ffd319290e92d95d499201773d2c))
* use RGB columns directly in personal stats query ([4417ecd](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/4417ecd6b33c7512e888a5cf22b827f83be90060))
* use stored procedure for SIGNAL statements in migration ([e2405bd](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/e2405bdbe43d64456e158703d7245cc5cfe2f934))
* use totalColorsClassified property name in StatsView ([ae3f695](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/ae3f69580b0f177af3acf0c943db18718c10903d))


### Features

* accept RGB values instead of color_id in responses endpoint ([79176b4](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/79176b42af84116ee43e54826f013b6047f03d00))
* add comprehensive backend testing with Jest ([21948dd](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/21948ddee18e61bd1eb32d1f127a4886418745b0))
* add migration for RGB columns in responses table ([82cd987](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/82cd987459a9d4f1efa53e976fa64a1dc84a8c68))
* add personal/global toggle to color cube visualization ([1a8faea](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/1a8faeae294ec05d6240ac40206c1c5bfc9a09f5))
* add personal/global view toggle to visualize endpoint ([ae196b5](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/ae196b5310e27e065e122be68e3201c1606c2628))
* generate random RGB colors instead of querying colors table ([246eea6](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/246eea63d3421a19b3cb40f8728bd3cdc7d3288c))
* remove color completion state (unlimited colors) ([5ed4657](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/5ed46578b36ddc0b4962e6c7cac5c99237928049))
* send RGB values instead of color_id, remove done state ([1c35d85](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/1c35d8534b7feb34a38744775d5b2498079a0522))
* simplify personal stats (remove controversial colors) ([8c6125f](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/8c6125fe080e1ae41bda51c8b661d986b85873a8))
* update global stats for unlimited RGB color space ([a886b9e](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/a886b9e275f3a737f3e3bbeaa278e5adfa27837f))
* update stats display for unlimited colors (remove /20, add X/16.7M) ([be500a3](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/be500a32841afacf454ad61d0671cf210235dc22))

# [1.3.0](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/compare/v1.2.0...v1.3.0) (2026-03-08)


### Bug Fixes

* simplify tag pattern for trigger workflow ([9ed262d](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/9ed262d4ee51fedb14d26be08be150476690c8aa))
* use create event instead of push for tag triggers ([19e2985](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/19e29856cc9180d3ef78979cd372246c1409ecab))
* use PAT for semantic-release to allow triggering other workflows ([e8b8609](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/e8b8609fb53028daf22ec6a7ea0e785560a23f20))


### Features

* auto-trigger RC deployment when RC tag is created ([791026c](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/791026c0e717a04e9c6761df03521145da8fe8c0))

# [1.2.0](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/compare/v1.1.2...v1.2.0) (2026-03-08)


### Bug Fixes

* add flex-grow to #root to fill viewport ([fabc21f](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/fabc21fb5633500e9bcab0e1c763b68687dad7ed))
* add security flags to language cookie (secure, sameSite, path) ([460d4d5](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/460d4d5eca5b6ed05a480a0b2ee3f2c4beccf44d))
* ensure body flex-direction allows #root to fill viewport ([5da704e](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/5da704e5e9e5665370701e5e487050f1bdf822fa))
* make cookie secure flag conditional for local development ([65652e1](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/65652e138cd9813578d799740dfb793e80283bdc))


### Features

* add language cookie check with auto-redirect on mount ([f0a96ba](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/f0a96bace7549f110896ac967c44a6c80a2153c6))
* persist language choice in cookie with 30-day expiry ([7a09905](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/7a099054f83d6e9a051c0833af257305ad80c25b))

## [1.1.2](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/compare/v1.1.1...v1.1.2) (2026-03-08)


### Bug Fixes

* remove escaped backticks causing JavaScript syntax error in rc-release workflow ([17e23c6](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/17e23c646dd8876ef19bf2a04f232175562c0e9a))

## [1.1.2-rc.1](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/compare/v1.1.1...v1.1.2-rc.1) (2026-03-08)


### Bug Fixes

* remove escaped backticks causing JavaScript syntax error in rc-release workflow ([17e23c6](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/17e23c646dd8876ef19bf2a04f232175562c0e9a))

## [1.1.1](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/compare/v1.1.0...v1.1.1) (2026-03-08)


### Bug Fixes

* correct YAML indentation in rc-release workflow template literal ([bbd6edc](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/bbd6edce1a296a2bb7383f7a75a6f5d2571bd2a6))

# [1.1.0](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/compare/v1.0.1...v1.1.0) (2026-03-08)


### Bug Fixes

* **ui:** add null safety checks to StatsView rendering ([8d822c1](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/8d822c1ec429a788370eebf6c942b3e3b24d1cff))
* **ui:** match About page styles to spec (gradient background, card design) ([dcf4f17](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/dcf4f172bd6b57cf22426fa5c8b77d8d1b84a930))
* **ui:** prevent memory leak in StatsView by adding cleanup to useEffect ([996140d](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/996140dfbe74878eac61db727d2a0acdd7f9f5e1))
* **ui:** prevent Other input disappearing and show completion message when all colors classified ([9ed12a6](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/9ed12a635a62a8d3db27271fd98ecf561138dcb7))


### Features

* **api:** add global stats endpoint ([82da819](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/82da8199e7bdf8c37baa3252967143e6ed08f708))
* **api:** add personal stats endpoint ([2d9a5da](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/2d9a5da6b144e59cc56452964af6c5db38d7f0fe))
* **api:** return wasFirst flag in response endpoint ([3b63f58](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/3b63f5826a0508685d3facb384b49e2379ac8df3))
* **db:** add classified_at timestamp to responses table ([b93e711](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/b93e7110017815fa0e6e22ed995fa6f47c78fec1))
* **ui:** add About page with placeholder content ([d1df44b](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/d1df44ba5cb512bb7f9d30bdd95c4b8868ee917a))
* **ui:** add Blog page with DevOps writeup placeholder ([9023d78](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/9023d7820f172f22fc555144fbe30b7e1bf6f911))
* **ui:** add Layout wrapper with Navbar ([b4210e3](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/b4210e3b13b735d6bf603bec68a05d2b858127ff))
* **ui:** add LeftPanel component for color classification ([edf7860](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/edf7860b276d6b2a5925b723be6dc6c3f1dd86c1))
* **ui:** add Navbar component ([d5c38e8](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/d5c38e8be3f5972b219caa9cb13bb6c7e7ad5040))
* **ui:** add RightPanel component with toggle functionality ([104bc50](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/104bc50458657339532f8affab439f131fa273fa))
* **ui:** add StatsView component for personal and global stats ([8d5ece0](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/8d5ece0ddfe5bbfd8e18948dd6bbeaa54357de49))
* **ui:** add ViewToggle component for stats/cube switching ([01d0c12](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/01d0c123a1cae6df7bf07c3ef01974134af47261))
* **ui:** add welcoming intro text to home page ([f39df32](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/f39df32428864a1244008e3b9361288a32d509b1))
* **ui:** refactor ColorClassifier to split-screen layout ([8c99c3c](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/8c99c3c5edaea11b77341e9f0715d03f5b7359e8))

## [1.0.1](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/compare/v1.0.0...v1.0.1) (2026-03-08)


### Bug Fixes

* ensure session is saved before inserting response ([c3811c2](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/c3811c2388fc342d6a2466043684edd40dcabfde))

# 1.0.0 (2026-03-08)


### Bug Fixes

* **backend:** correct colors API to match spec - session-aware routes ([2c81277](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/2c81277288651a9fed9183beea9970179de4fb9d))


### Features

* add docker-compose for local development with MySQL ([51b7352](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/51b73528f9b35b41cb53d9b97cc6abe9a3a29c46))
* add multi-stage Dockerfile for production builds ([99488d2](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/99488d2f400964b3b9869b62fc680d6981d009cd))
* add notifications to RC release workflow ([efe5c65](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/efe5c65e4452fea3a79cfcde50dc5fb706e1a4e3))
* add semantic release and RC deployment workflows ([09aa992](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/09aa992b13985ca2afe5b9c34b5a462323638b2a))
* **backend:** add colors API endpoints for fetching random colors ([bef0b2c](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/bef0b2cadd37b4f107297a1785d461a4bd950e28))
* **backend:** add database schema, seed data, and connection pool ([e26b774](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/e26b77422e17d5a328436bf0a7b31eb198d851f8))
* **backend:** add language selection API endpoint ([59bef78](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/59bef78910c91dd1022eadc7ee8f2892012dc03f))
* **backend:** add response submission API endpoint ([98c9f48](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/98c9f481bf81d1f340e9d5f7af7228b0687774fe))
* **backend:** add results API endpoint with agreement calculations ([8a26fd4](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/8a26fd40103cc325b20e07cbe0b92cb974de892e))
* **backend:** add visualization data API with controversy metrics ([7a1254e](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/7a1254e4ca442aed29460b67367c19125b9e3eb8))
* **backend:** configure session management with MySQL store ([6573c6e](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/6573c6e794d2231de5353067a8101daca543ba1a))
* **backend:** initialize Express server with health endpoint ([1c5718f](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/1c5718fe6257e007b9f2f524528155a3e579e42e))
* **frontend:** configure React Router with application routes ([1271660](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/1271660f63205e05aa43616b50da21bbc3828953))
* **frontend:** create 3D color cube visualization with Three.js ([3a4ed9f](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/3a4ed9f66ee60ee24fafc535c590c13d13a473e1))
* **frontend:** create color classifier component ([e184c51](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/e184c512f00597335de40c2f5101392b8ecc85e5))
* **frontend:** create language selection component ([8ad13fd](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/8ad13fdca9ff1d688606b62c19f9341efe41bc93))
* **frontend:** create results page with agreement statistics ([cc59809](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/cc59809a929524e560f5bc488e7ff2f9b157ca59))
* **frontend:** initialize Vite React app with Three.js dependencies ([bffb92c](https://github.com/jsrahoi-dev/devops-spring26-midterm-source/commit/bffb92c10058b20804b74d674e530269b2bdfb34))
