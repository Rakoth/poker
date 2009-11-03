require 'rake'
namespace :delete_games do
	desc 'delete all finished games'
	task :finished => :environment do
		Game.finished.each(&:destroy)
	end

	desc 'delete all games, updated more than day ago'
	task :all_expired => :environment do
		Game.all(:conditions => ['updated_at < ?', 1.day.ago]).each(&:destroy)
	end

	desc 'delete all games'
	task :all => :environment do
		Game.all.each(&:destroy)
	end
end